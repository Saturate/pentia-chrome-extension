// Test URL: http://tfs15.pentia.dk/Folketinget/FT.dk/_backlogs#_a=backlog&hub=Features&filter=Tasks
// http://tfs15.pentia.dk/Folketinget/_apis/wit/workitemrelationtypes?api-version=1.0



/*****

   Config

*****/

function TFS15Enhance () {

  var COLLECTION = document.location.pathname.split('/')[1]; // "Folketinget";
  var PROJECT = document.location.pathname.split('/')[2]; //"FT.dk";
  var FEATUREID = $('.ui-dialog .caption').text().replace(/feature (\d+)\:/gi, '$1'); //453;

  var Collections = {}
  Collections["Folketinget"] = [
      {
          name: 'Kunde TEST',
          description: '',
          TASKS: [
            {
              Title: 'Test i Testmiljø',
              Description: '',
              RemainingWork: 0.5
            },
            {
              Title: 'Test i produktionsmiljø',
              Description: '',
              RemainingWork: 0.5
            }
          ]
      },
      {
          name: 'Pentia TEST',
          description: '',
          TASKS: [
            {
              Title: 'Test i Testmiljø',
              Description: '',
              RemainingWork: 0.5
            },
            {
              Title: 'Test i produktionsmiljø',
              Description: '',
              RemainingWork: 0.5
            }
          ]
      }
  ];

  /*****

     Code

  *****/

  // Get currently selected task
  var $currentFeature = $('.grid-row-current').closest('.grid-row').find('.action');
  var arrayOfPromises = [];

  $.each(Collections[COLLECTION], function(i, pbi) {

      if (!FEATUREID) {
          $( '<div><strong>Ooops!</strong><br>You need to open a Feature in a dialog to get its ID. Then run this action. <br> <br> Still got trouble? Contact <a href="mailto:akj@pentia.dk">akj@pentia.dk</a>.<br></div>' ).dialog();
          throw new Error('No ID provided, we need one to know where to make the tasks.');
      }

      console.log('Selected feature has ID %s', FEATUREID);
      arrayOfPromises.push(new Promise(function(resolve, reject) {
        makeProductBacklogItem(pbi, FEATUREID, resolve, reject);
      }));
  });


  Promise.all(arrayOfPromises).then(function(arrayOfResults) {
    //...
    console.log('All done!', arrayOfResults);
  });

  function makeProductBacklogItem (pbi, parentFeatureId, resolve, reject) {
      var postBody = JSON.stringify([
        {
          "op": "add",
          "path": "/fields/System.Title",
          "value": pbi.name
        },
        {
          "op": "add",
          "path": "/fields/System.Description",
          "value": pbi.description
        },
        {
          "op": "add",
          "path": "/relations/-",
          "value": {
            "rel": "System.LinkTypes.Hierarchy-Reverse",
            "url": "http://tfs15.pentia.dk/Folketinget/_apis/wit/workItems/" + parentFeatureId,
            "attributes": {
               "comment": "Making a new link for the dependency"
            }
          }
        }
     ]);

     $.ajax({
          url: "http://tfs15.pentia.dk/Folketinget/FT.dk/_apis/wit/workitems/$Product Backlog Item?api-version=1.0",
          contentType : 'application/json-patch+json',
          type: 'PATCH',
          data: postBody
      }).done(function(a) {

          console.log('RESPONSE:', a);
          console.info('Created PBI with ID: %s', a.id);
          var taskPromises = [];

          $.each(pbi.TASKS, function(i, task) {
              taskPromises.push(new Promise(function(resolve, reject) {
                console.log('Make task: %s', task);
                makeTaskItem(task, a.id, function(taskReponse) {
                    resolve([a.id, taskReponse.id]);
                });
              }));
          });

          // When all tasks has been created
          Promise.all(taskPromises).then(function(arrayOfResults) {
            resolve(arrayOfResults);
          });
      });
  }

  function makeTaskItem (task, parentPbiId, callback) {
    console.log();
    var postBody = JSON.stringify([
      {
        "op": "add",
        "path": "/fields/System.Title",
        "value": task.Title
      },
      {
        "op": "add",
        "path": "/fields/System.Description",
        "value": task.Description
      },
      {
        "op": "add",
        "path": "/fields/Microsoft.VSTS.Scheduling.RemainingWork",
        "value": task.RemainingWork
      },
      {
        "op": "add",
        "path": "/relations/-",
        "value": {
          "rel": "System.LinkTypes.Hierarchy-Reverse",
          "url": "http://tfs15.pentia.dk/Folketinget/_apis/wit/workItems/" + parentPbiId,
          "attributes": {
            "comment": "Making a new link for the dependency"
          }
        }
       }
    ]);

    $.ajax({
        url: "http://tfs15.pentia.dk/" +COLLECTION+ "/" +PROJECT+ "/_apis/wit/workitems/$Task?api-version=1.0",
        contentType : 'application/json-patch+json',
        type: 'PATCH',
        data: postBody
    }).done(function(response) {
      console.log('RESPONSE:',response);
      console.info('Created Task with ID: %s', response.id);
      callback(response);
    });
  }

  /*
  $.ajax({
      url: "http://tfs15.pentia.dk/" +COLLECTION+ "/_apis/wit/workitems/453?api-version=1.0",
      contentType : 'application/json-patch+json',
      type: 'GET'
  }).done(function(a) {
    console.log('RESPONSE:',a);
  });
  */
}

// Add default tasks.
var $addBtn = $('<button>Add default PBIs and TASKS.</button>');
$addBtn.on('click', TFS15Enhance);
$('.ui-dialog .info-text')
  .after($addBtn);
