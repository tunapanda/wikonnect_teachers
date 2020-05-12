import { ReadStream } from 'fs';
import fsExtra from 'fs-extra';
import globPromise from 'glob-promise';
import path from 'path';
import promisepipe from 'promisepipe';
import { streamToString } from '../../helpers/StreamHelpers';

import { Stream } from 'stream';
import {
    ContentId,
    H5pError,
    IContentMetadata,
    IContentStorage,
    IUser,
    Permission,
    ContentParameters
} from '../../../src';
import checkFilename from './filenameCheck';

/**
 * Persists content to the disk.
 */
export default class FileContentStorage implements IContentStorage {
    /**
     * Generates a unique content id that hasn't been used in the system so far.
     * @returns A unique content id
     */
    protected async createContentId(): Promise<ContentId> {
        let counter = 0;
        let id;
        let exists = false;
        do {
            id = FileContentStorage.getRandomInt(1, 2 ** 32);
            counter += 1;
            const p = path.join(this.contentPath, id.toString());
            exists = await fsExtra.pathExists(p);
        } while (exists && counter < 5); // try 5x and give up then
        if (exists) {
            throw new H5pError(
                'storage-file-implementations:error-generating-content-id'
            );
        }
        return id;
    }
    /**
     * @param contentPath The absolute path to the directory where the content should be stored
     */
    constructor(private contentPath: string) {
        fsExtra.ensureDirSync(contentPath);
    }

    /**
     * Returns a random integer
     * @param min The minimum
     * @param max The maximum
     * @returns a random integer
     */
    private static getRandomInt(min: number, max: number): number {
        const finalMin = Math.ceil(min);
        const finalMax = Math.floor(max);
        return Math.floor(Math.random() * (finalMax - finalMin + 1)) + finalMin;
    }

    /**
     * Creates a content object in the repository. Add files to it later with addContentFile(...).
     * Throws an error if something went wrong. In this case no traces of the content are left in storage and all changes are reverted.
     * @param metadata The metadata of the content (= h5p.json)
     * @param content the content object (= content/content.json)
     * @param user The user who owns this object.
     * @param id (optional) The content id to use
     * @returns The newly assigned content id
     */
    public async addContent(
        metadata: IContentMetadata,
        content: any,
        user: IUser,
        id?: ContentId
    ): Promise<ContentId> {
        if (id === undefined || id === null) {
            // tslint:disable-next-line: no-parameter-reassignment
            id = await this.createContentId();
        }
        try {
            await fsExtra.ensureDir(path.join(this.contentPath, id.toString()));
            await fsExtra.writeJSON(
                path.join(this.contentPath, id.toString(), 'h5p.json'),
                metadata
            );
            await fsExtra.writeJSON(
                path.join(this.contentPath, id.toString(), 'content.json'),
                content
            );
        } catch (error) {
            await fsExtra.remove(path.join(this.contentPath, id.toString()));
            throw new H5pError(
                'storage-file-implementations:error-creating-content'
            );
        }
        return id;
    }

    /**
     * Adds a content file to an existing content object. The content object has to be created with createContent(...) first.
     * @param id The id of the content to add the file to
     * @param filename The filename
     * @param stream A readable stream that contains the data
     * @param user The user who owns this object
     * @returns
     */
    public async addFile(
        id: ContentId,
        filename: string,
        stream: Stream,
        user: IUser
    ): Promise<void> {
        checkFilename(filename);
        if (
            !(await fsExtra.pathExists(
                path.join(this.contentPath, id.toString())
            ))
        ) {
            throw new H5pError(
                'storage-file-implementations:add-file-content-not-found',
                { filename, id },
                404
            );
        }

        const fullPath = path.join(this.contentPath, id.toString(), filename);
        await fsExtra.ensureDir(path.dirname(fullPath));
        const writeStream = fsExtra.createWriteStream(fullPath);
        await promisepipe(stream, writeStream);
    }

    /**
     * Checks if a piece of content exists in storage.
     * @param contentId the content id to check
     * @returns true if the piece of content exists
     */
    public async contentExists(contentId: ContentId): Promise<boolean> {
        return fsExtra.pathExists(
            path.join(this.contentPath, contentId.toString())
        );
    }

    /**
     * Deletes a content object and all its dependent files from the repository.
     * Throws errors if something goes wrong.
     * @param id The content id to delete.
     * @param user The user who wants to delete the content
     * @returns
     */
    public async deleteContent(id: ContentId, user?: IUser): Promise<void> {
        if (
            !(await fsExtra.pathExists(
                path.join(this.contentPath, id.toString())
            ))
        ) {
            throw new H5pError(
                'storage-file-implementations:delete-content-not-found',
                {},
                404
            );
        }

        await fsExtra.remove(path.join(this.contentPath, id.toString()));
    }

    /**
     * Deletes a file from a content object.
     * @param contentId the content object the file is attached to
     * @param filename the file to delete
     */
    public async deleteFile(
        contentId: ContentId,
        filename: string
    ): Promise<void> {
        checkFilename(filename);
        const absolutePath = path.join(
            this.contentPath,
            contentId.toString(),
            filename
        );
        if (!(await fsExtra.pathExists(absolutePath))) {
            throw new H5pError(
                'storage-file-implementations:delete-content-file-not-found',
                { filename },
                404
            );
        }
        await fsExtra.remove(absolutePath);
    }

    /**
     * Checks if a file exists.
     * @param contentId The id of the content to add the file to
     * @param filename the filename of the file to get
     * @returns true if the file exists
     */
    public async fileExists(
        contentId: ContentId,
        filename: string
    ): Promise<boolean> {
        checkFilename(filename);
        return fsExtra.pathExists(
            path.join(this.contentPath, contentId.toString(), filename)
        );
    }

    /**
     * Returns a readable stream of a content file (e.g. image or video) inside a piece of content
     * @param id the id of the content object that the file is attached to
     * @param filename the filename of the file to get
     * @param user the user who wants to retrieve the content file
     * @returns
     */
    public async getFileStream(
        id: ContentId,
        filename: string,
        user: IUser
    ): Promise<ReadStream> {
        if (!(await this.fileExists(id, filename))) {
            throw new H5pError(
                'content-file-missing',
                { filename, contentId: id },
                404
            );
        }
        return fsExtra.createReadStream(
            path.join(this.contentPath, id.toString(), filename)
        );
    }

    /**
     * Returns the content metadata (=h5p.json) for a content id
     * @param contentId the content id for which to retrieve the metadata
     * @param user (optional) the user who wants to access the metadata. If undefined, access must be granted.
     * @returns the metadata
     */
    public async getMetadata(
        contentId: string,
        user?: IUser
    ): Promise<IContentMetadata> {
        return JSON.parse(
            await streamToString(
                await this.getFileStream(contentId, 'h5p.json', user)
            )
        );
    }

    /**
     * Returns the parameters (=content.json) for a content id
     * @param contentId the content id for which to retrieve the metadata
     * @param user (optional) the user who wants to access the metadata. If undefined, access must be granted.
     * @returns the parameters
     */
    public async getParameters(
        contentId: string,
        user?: IUser
    ): Promise<ContentParameters> {
        return JSON.parse(
            await streamToString(
                await this.getFileStream(contentId, 'content.json', user)
            )
        );
    }

    /**
     * Returns an array of permissions that the user has on the piece of content
     * @param contentId the content id to check
     * @param user the user who wants to access the piece of content
     * @returns the permissions the user has for this content (e.g. download it, delete it etc.)
     */
    public async getUserPermissions(
        contentId: ContentId,
        user: IUser
    ): Promise<Permission[]> {
        return [
            Permission.Delete,
            Permission.Download,
            Permission.Edit,
            Permission.Embed,
            Permission.View
        ];
    }

    /**
     * Lists the content objects in the system (if no user is specified) or owned by the user.
     * @param user (optional) the user who owns the content
     * @returns a list of contentIds
     */
    public async listContent(user?: IUser): Promise<ContentId[]> {
        const directories = await fsExtra.readdir(this.contentPath);
        return (
            await Promise.all(
                directories.map(async (dir) => {
                    if (
                        !(await fsExtra.pathExists(
                            path.join(this.contentPath, dir, 'h5p.json')
                        ))
                    ) {
                        return '';
                    }
                    return dir;
                })
            )
        ).filter((content) => content !== '');
    }

    /**
     * Gets the filenames of files added to the content with addContentFile(...) (e.g. images, videos or other files)
     * @param contentId the piece of content
     * @param user the user who wants to access the piece of content
     * @returns a list of files that are used in the piece of content, e.g. ['image1.png', 'video2.mp4']
     */
    public async listFiles(
        contentId: ContentId,
        user: IUser
    ): Promise<string[]> {
        const contentDirectoryPath = path.join(
            this.contentPath,
            contentId.toString()
        );
        const absolutePaths = await globPromise(
            path.join(contentDirectoryPath, '**', '*.*'),
            {
                ignore: [
                    path.join(contentDirectoryPath, 'content.json'),
                    path.join(contentDirectoryPath, 'h5p.json')
                ],
                nodir: true
            }
        );
        return absolutePaths.map((p) => path.relative(contentDirectoryPath, p));
    }
}
