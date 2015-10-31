
var app = angular.module('myApp', []);

app.controller('myCtrl', function($scope) {
    $scope.data = {
        selectedRequirement:  localStorage.getItem('selectedEpisode'),
        requirements: requirements,
        annotator: localStorage.getItem('annotator'),
        annotatorExperience: localStorage.getItem('annotatorExperience'),
        annotatorTitle:localStorage.getItem('annotatorTitle')
    }


    $scope.copyToClipboard = function() {
        var text = JSON.stringify($scope.getModel());
        window.prompt("Copy to clipboard: Ctrl+C, Enter", text);
    }


    $(document).ready(
        function () {
            $scope.data.selectedRequirement =  localStorage.getItem('selectedEpisode');
            $scope.data.annotator = localStorage.getItem('annotator');
            $scope.loadTree();
        }
    )

    $scope.neededProperties = ["text", "type", "children"];

    $scope.removeUnNeededProperties = function(node) {

        for (var prop in node) {
            if ( $scope.neededProperties.indexOf(prop) == -1) {
                console.log("delete " + prop);
                delete node[prop];
            }
        }
        if (node.children && node.children.length > 0)
            for (var i in node.children) {
                $scope.removeUnNeededProperties(node.children[i])
            }
        return node;
    }

    $scope.getModel = function() {
        var json = $("#tree").jstree(true).get_json();
        var root = json[0];

        return $scope.removeUnNeededProperties(root);
    }

    $scope.sendMail = function() {
           var model = encodeURI(JSON.stringify( $scope.getModel()));
       var subject =  'Data modeling for episode: ' + $scope.data.selectedRequirement + ' ,From: '+ $scope.data.annotator + " ," + $scope.data.annotatorTitle + " ," + $scope.data.annotatorExperience;

        var win = window.open('mailto:eli.pog@gmail.com?subject='+subject + '&body=' + model);
        setTimeout(function () {
            win.close();
        }, 100);

    }

// inline data demo
     $scope.functionalNodes = ["classes", "properties", "methods", "returnType", "arguments", "extendsClass", "type"];

    $scope.reset = function() {

        localStorage.setItem('jstreejson', JSON.stringify( $scope.cleanTemplate()));
        localStorage.setItem('selectedEpisode', "");
        location.reload(true);

    }

    $scope.cleanTemplate = function() {
        return [
            {
                "text": "Classes",
                "type": "classes",
                "children": []
            }
        ];
    }

    $scope.getInitialData = function() {
        var dataStr = localStorage.getItem('jstreejson');
        if (dataStr && dataStr.length > 0) {
            var data = JSON.parse(dataStr);
            if (data.length > 0)
                return data;
        }
        return  $scope.cleanTemplate();
    }

    $scope.getNodeById  = function(data, id) {
        var res = null;
        if (data.id == id) return data;
        if (data.children && data.children.length > 0)
            for (var idx in data.children) {
                var tmp =  $scope.getNodeById(data.children[idx], id);
                if (tmp)
                    res = tmp;
            }
        return res;
    }

    $scope.loadTree = function() {
        var $tree = $('#tree');
        var treeObj = $tree.jstree({
            "plugins": [
                "contextmenu", "dnd", "search",
                "state", "types", "wholerow", "html_data", "themes", "ui", "dnd", "crrm"
            ],
            "types": {
                "classes": {},
                "properties": {},
                "methods": {},
                "returnType": {},
                "extendsClass": {},
                "arguments": {},
                "type": {},
                "leave": {}
            },
            'core': {
                "animation": 0,
                "check_callback": true,
                "themes": {"stripes": true},
                'data': $scope.getInitialData()
            },
            "contextmenu": {
                "items": function ($node) {
                    var tree = $("#tree").jstree(true);

                    var type = $node.type;

                    var customNodeContextMenu = {
                        "Create": {
                            "label": "Create" ,
                            "action": function () {
                                $node = tree.create_node($node);
                                tree.edit($node);
                            }
                        },
                        "Rename": {
                            "label": "Rename",
                            "action": function () {
                                tree.edit($node);
                            }
                        },
                        "Delete": {
                            "label": "Delete",
                            "action": function () {
                                tree.delete_node($node);
                            }
                        }
                    };

                    var leavesContextMenu = {
                        "Rename": {
                            "label": "Rename",
                            "action": function () {
                                tree.edit($node);
                            }
                        },
                        "Delete": {
                            "label": "Delete",
                            "action": function () {
                                tree.delete_node($node);
                            }
                        }
                    };
                    var functionalNodeContextMenu = {
                        "Create": {
                            "label": "Create",
                            "action": function () {
                                $node = tree.create_node($node);
                                tree.edit($node);
                                ;
                            }
                        }
                    }
                    if ( $scope.functionalNodes.indexOf(type) > -1)
                        return functionalNodeContextMenu;
                    if (type == "leave");
                    return leavesContextMenu;
                    return customNodeContextMenu;
                }
            }
        });
        if (treeObj && treeObj.on) {
            treeObj.on("create_node.jstree", function (event, data) {
                var tree = $("#tree").jstree(true);
                var node = data.node;
                var parentNode =  $scope.getNodeById(tree.get_json()[0], node.parent);

                if (parentNode) {
                    var type = parentNode.type;
                    if ( $scope.functionalNodes.indexOf(type) > -1) {
                        $scope.createSubTree(type, tree, node);
                    }
                    //set type leaves
                    if (type == "type")
                        tree.set_type(node.id, "leave");
                }
                tree.open_node(node.id);
            })
                .on("changed.jstree", function (event, data) {
                    localStorage.setItem('jstreejson', JSON.stringify($("#tree").jstree(true).get_json()));
                });

        }
    }


    $scope.changeEpisode = function(){
        localStorage.setItem('selectedEpisode', $scope.data.selectedRequirement);
    }
    $scope.createSubTree = function(type, tree, node) {
        if (type == "classes") {
            $scope.createClassSubTree(tree, node);
        }
        if (type == "methods") {
            $scope.createMethodsSubTree(tree, node);
        }
        if (type == "properties" || type == "arguments") {
            $scope.createObjectSubTree(tree, node);
        }
    }

    $scope.createClassSubTree = function(tree, node) {
        $scope.createRenameRetypeOpenNode(tree, node, "extends", "extendsClass")
        $scope.createRenameRetypeOpenNode(tree, node, "Methods", "methods")
        $scope.createRenameRetypeOpenNode(tree, node, "Properties", "properties")


    }

    $scope.createMethodsSubTree = function(tree, node) {
        $scope.createRenameRetypeOpenNode(tree, node, "returnType", "returnType")
        $scope.createRenameRetypeOpenNode(tree, node, "Arguments", "arguments")


    }

    $scope.createObjectSubTree = function(tree, node) {
        $scope.createRenameRetypeOpenNode(tree, node, "Type", "type")
    }

    $scope.createRenameRetypeOpenNode = function(tree, parent, name, type) {
        var childIdx = tree.create_node(parent);
        tree.rename_node(childIdx, name);
        tree.set_type(childIdx, type);
        tree.open_node(childIdx);

    }

    $scope.setAnnotatorName = function(){
        localStorage.setItem('annotator',$scope.data.annotator);
        localStorage.setItem('annotatorExperience',$scope.data.annotatorExperience);
        localStorage.setItem('annotatorTitle',$scope.data.annotatorTitle);
    }

    $scope.sendMailViaServer = function(){
        if(!$scope.data.annotator || $scope.data.annotator.length == 0){
            alert("please enter your name and try again");
            return;
        }
        if(!$scope.data.selectedRequirement || $scope.data.selectedRequirement == null || $scope.data.selectedRequirement.length == 0){
            alert("please select on of the episodes");
            return;
        }
        var model = $scope.getModel();
        if(model.children.length == 0){
            alert("please make sure that the model is not trivial (at least contains one created class");
            return;
        }
        $scope.loading();

        $.get("/send",{
            to:'eli.pog@gmail.com',
            subject: 'Data modeling for episode: ' + $scope.data.selectedRequirement + ' ,From: '+ $scope.data.annotator + " ," + $scope.data.annotatorTitle + " ," + $scope.data.annotatorExperience,
            text: JSON.stringify(model)
        },function(data){
            if( data=="sent" ) {
                alert("Email has been sent to eli.pog@gmail.com . Thanks :)");
            }else{
                alert("Error :( , try to send your annotation by mail with the 2 other options");
            }
            $('#overlay').remove();
        });
    }


    $scope.loading = function() {
        // add the overlay with loading image to the page
        var over = '<div id="overlay">' +
            '<img id="loading" src="http://bit.ly/pMtW1K">' +
            '</div>';
        $(over).appendTo('body');
    }



});
