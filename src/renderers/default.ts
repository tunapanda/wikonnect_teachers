export default (model) => `
<!doctype html>
<html>
<head>

<meta charset="UTF-8">
<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">
<script> window.H5PIntegration = parent.H5PIntegration || ${JSON.stringify(
  model.integration,
  null,
  2
)}</script>
${model.styles
    .map((style) => `<link rel="stylesheet" href="${style}">`)
    .join('\n    ')}
${model.scripts
    .map((script) => `<script src="${script}"></script>`)
    .join('\n    ')}
</head>
<body>


  <script>
  var ns = H5PEditor;
  
  (function($) {
      H5PEditor.init = function() {
          H5PEditor.$ = H5P.jQuery;
          H5PEditor.basePath = H5PIntegration.editor.libraryUrl;
          H5PEditor.fileIcon = H5PIntegration.editor.fileIcon;
          H5PEditor.ajaxPath = H5PIntegration.editor.ajaxPath;
          H5PEditor.filesPath = H5PIntegration.editor.filesPath;
          H5PEditor.apiVersion = H5PIntegration.editor.apiVersion;
  
          // Semantics describing what copyright information can be stored for media.
          H5PEditor.copyrightSemantics = H5PIntegration.editor.copyrightSemantics;
          H5PEditor.metadataSemantics = H5PIntegration.editor.metadataSemantics;
  
          // Required styles and scripts for the editor
          H5PEditor.assets = H5PIntegration.editor.assets;
  
          // Required for assets
          H5PEditor.baseUrl = '';
  
          if (H5PIntegration.editor.nodeVersionId !== undefined) {
              H5PEditor.contentId = H5PIntegration.editor.nodeVersionId;
          }
  
          var h5peditor;
          var $type = $('input[name="action"]');
          var $upload = $('.h5p-upload');
          var $create = $('.h5p-create').hide();
          var $editor = $('.h5p-editor');
          var $library = $('input[name="library"]');
          var $params = $('input[name="parameters"]');
          var library = $library.val();
  
          // $type.change(function () {
          //   if ($type.filter(':checked').val() === 'upload') {
          //     $create.hide();
          //     $upload.show();
          //   }
          //   else {
          $upload.hide();
          if (h5peditor === undefined) {
              $.ajax({
                  error: function(res) {
                      h5peditor = new ns.Editor(undefined, undefined, $editor[0]);
                      $create.show();
                  },
                  success: function(res) {
                      h5peditor = new ns.Editor(
                          res.library,
                          JSON.stringify(res.params),
                          $editor[0]
                      );
                      $create.show();
                      // $type.change();
                  },
                  type: 'GET',
                  url: '${model.urlGenerator.parameters()}/' + H5PEditor.contentId + window.location.search
              });
          }
          $create.show();
          //   }
          // });
  
          if ($type.filter(':checked').val() === 'upload') {
              $type.change();
          } else {
              $type
                  .filter('input[value="create"]')
                  .attr('checked', true)
                  .change();
          }
  
          $('#h5p-content-form').submit(function(event) {
              if (h5peditor !== undefined) {
                  var params = h5peditor.getParams();
  
                  if (params.params !== undefined) {
                      // Validate mandatory main title. Prevent submitting if that's not set.
                      // Deliberately doing it after getParams(), so that any other validation
                      // problems are also revealed
                      // if (!h5peditor.isMainTitleSet()) {
  
                      // }
  
                      // Set main library
                      $library.val(h5peditor.getLibrary());
  
                      // Set params
                      $params.val(JSON.stringify(params));
  
                      $.ajax({
                          data: JSON.stringify({
                              library: h5peditor.getLibrary(),
                              params
                          }),
                          headers: {
                              'Content-Type': 'application/json'
                          },
                          type: 'POST'
                      }).then((result) => {
                          const parsedResult = JSON.parse(result)
                          if(parsedResult.contentId) {
                              window.location.href = '${model.urlGenerator.play()}/' + parsedResult.contentId;
                          }
                      });
  
                      return event.preventDefault();
                      // TODO - Calculate & set max score
                      // $maxscore.val(h5peditor.getMaxScore(params.params));
                  }
              }
          });
  
          // Title label
          var $title = $('#h5p-content-form #title');
          var $label = $title.prev();
          $title
              .focus(function() {
                  $label.addClass('screen-reader-text');
              })
              .blur(function() {
                  if ($title.val() === '') {
                      $label.removeClass('screen-reader-text');
                  }
              })
              .focus();
  
          // Delete confirm
          $('.submitdelete').click(function() {
              return confirm(H5PIntegration.editor.deleteMessage);
          });
      };
  
      H5PEditor.getAjaxUrl = function(action, parameters) {
          var url = H5PIntegration.editor.ajaxPath + action;
  
          if (parameters !== undefined) {
              for (var property in parameters) {
                  if (parameters.hasOwnProperty(property)) {
                      url += '&' + property + '=' + parameters[property];
                  }
              }
          }
  
          url += window.location.search.replace(/\\?/g, '&');
          return url;
      };
  
      $(document).ready(H5PEditor.init);
  })(H5P.jQuery);
  </script>
  <div class="container-fluid">

    <form method="post" enctype="multipart/form-data" id="h5p-content-form">

    <div class="row mt-3">
  <div class="col-lg-8">
  <div id="post-body-content">
  <div class="h5p-create">
      <div class="h5p-editor"></div>
  </div>
</div>
  </div>

  <div class="col-lg-4">
  <div class="card">
  <img class="card-img-top" src="holder.js/100x180/" alt="">
  <div class="card-body">
    <h4 class="card-title">Actions</h4>
    <p class="card-text">    <input type="submit" name="submit" value="Preview H5P" class="btn btn-success">
    </p>
  </div>
</div>
  </div>
</div>
  
</form>
</div>

<script src="https://code.jquery.com/jquery-3.3.1.slim.min.js" integrity="sha384-q8i/X+965DzO0rT7abK41JStQIAqVgRVzpbzo5smXKp4YfRvH+8abtTE1Pi6jizo" crossorigin="anonymous"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.7/umd/popper.min.js" integrity="sha384-UO2eT0CpHqdSJQ6hJty5KVphtPhzWj9WO1clHTMGa3JDZwrnQq4sF86dIHNDz0W1" crossorigin="anonymous"></script>
    <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.min.js" integrity="sha384-JjSmVgyd0p3pXB1rRibZUAYoIIy6OrQ6VrjIEaFf/nJGzIxFDsf4x0xIM+B07jRM" crossorigin="anonymous"></script>
  
</body>
</html>`;
