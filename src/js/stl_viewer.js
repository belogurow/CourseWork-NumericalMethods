// Global variables
var ground;
var objects = [];
var legMeshVertices = [];
var cubeMeshVertices = [];
// var canvas, engine, scene, camera, score = 0;

/**
 * Load the scene when the canvas is fully loaded
 */
window.addEventListener("DOMContentLoaded", function () {
    if (BABYLON.Engine.isSupported()) {
        initScene();
        addGUI();
    } else {
        alert("Cannot load Babylon JS scene.")
    }
}, false);


function initScene() {
    // get the canvas DOM element
    var canvas = document.getElementById('renderCanvas');

    // load the 3D engine
    var engine = new BABYLON.Engine(canvas, true);

    // createScene function that creates and return the scene
    var createScene = function (canvas) {
        // create a basic BJS Scene object
        var scene = new BABYLON.Scene(engine);
        scene.gravity = new BABYLON.Vector3(0, -9.81, 0);


        // create a FreeCamera, and set its position to (x:0, y:5, z:-10)
        // var camera = new BABYLON.FreeCamera('camera1', new BABYLON.Vector3(0, 5,-10), scene);
        var camera = new BABYLON.ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 4, 10, BABYLON.Vector3.Zero(), scene);
        // camera.setTarget(new BABYLON.Vector3(0, 0, 10));
        // camera.attachControl(this.canvas);

        // target the camera to scene origin
        camera.setTarget(BABYLON.Vector3.Zero());

        // attach the camera to the canvas
        camera.attachControl(canvas, true);

        // create a basic light, aiming 0,1,0 - meaning, to the sky
        var light1 = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(1, 1, 0), scene);
        var light2 = new BABYLON.PointLight("light2", new BABYLON.Vector3(0, 1, -1), scene);

        // create a built-in "sphere" shape; its constructor takes 6 params: name, segment, diameter, scene, updatable, sideOrientation
        // var sphere = BABYLON.Mesh.CreateSphere('sphere1', 16, 2, scene);


        // BABYLON.SceneLoader.ImportMesh("", "../stl_models/", "Cube.stl", scene, function (newMeshes) {
        //     var mesh = newMeshes[0];
        //
        //     mesh.position.x = 0;
        //     mesh.position.z = -4;
        //
        //     var myMaterial = new BABYLON.StandardMaterial("myMaterial", scene);
        //
        //     myMaterial.diffuseColor = new BABYLON.Color3(0, 0.5, 0.3);
        //     mesh.material = myMaterial;
        //     objects.push(mesh);
        //
        //     var vertexData = BABYLON.VertexData.ExtractFromMesh(mesh);
        //     var positions = vertexData.positions;
        //     var numberOfPoints = positions.length / 3;
        //     for (var i = 0; i < numberOfPoints; i++) {
        //         var p = new BABYLON.Vector3(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
        //         cubeMeshVertices.push(p);
        //     }
        //     var a = 0;
        // });
        //
        // BABYLON.SceneLoader.ImportMesh("", "../stl_models/", "Leg.stl", scene, function (newMeshes) {
        //     var mesh = newMeshes[0];
        //
        //     mesh.freezeWorldMatrix();
        //     // mesh.position.y = 1;
        //     // mesh.rotate(BABYLON.Axis.Z, Math.PI, BABYLON.Space.WORLD);
        //
        //
        //
        //     var myMaterial = new BABYLON.StandardMaterial("myMaterial", scene);
        //
        //     myMaterial.diffuseColor = new BABYLON.Color3(1, 0.5, 0.3);
        //     myMaterial.specularColor = new BABYLON.Color3(0.5, 0.6, 0.87);
        //     myMaterial.freeze();
        //
        //
        //     // myMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
        //     // myMaterial.ambientColor = new BABYLON.Color3(0.23, 0.98, 0.53);
        //
        //     mesh.material = myMaterial;
        //     objects.push(mesh);
        //
        //     var vertexData = BABYLON.VertexData.ExtractFromMesh(mesh);
        //     var positions = vertexData.positions;
        //     var numberOfPoints = positions.length / 3;
        //     for (var i = 0; i < numberOfPoints; i++) {
        //         var p = new BABYLON.Vector3(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
        //         legMeshVertices.push(p);
        //     }
        //
        //     // legMeshVertices = uniqBy(legMeshVertices, JSON.stringify);
        //
        // });

        var ground = createGround(scene);

        // Events

        var startingPoint;
        var currentMesh, anotherMesh;

        var getGroundPosition = function () {
            // Use a predicate to get position on the ground
            var pickinfo = scene.pick(scene.pointerX, scene.pointerY, function (mesh) {
                return mesh === ground;
            });
            if (pickinfo.hit) {
                return pickinfo.pickedPoint;
            }

            return null;
        };

        var onPointerDown = function (evt) {
            if (evt.button !== 0) {
                return;
            }

            // check if we are under a mesh
            var pickInfo = scene.pick(scene.pointerX, scene.pointerY, function (mesh) {
                return mesh !== ground;
            });
            if (pickInfo.hit) {
                currentMesh = pickInfo.pickedMesh;
                anotherMesh = getAnotherItemFromArray(objects, currentMesh);

                // anotherMesh
                // var vertexData = BABYLON.VertexData.ExtractFromMesh(anotherMesh);
                // var positions = vertexData.positions;
                // var numberOfPoints = positions.length / 3;
                // for (var i = 0; i < numberOfPoints; i++) {
                //     var p = new BABYLON.Vector3(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
                //     legMeshVertices.push(p);
                // }
                // legMeshVertices = uniqBy(legMeshVertices, JSON.stringify);

                startingPoint = getGroundPosition(evt);

                if (startingPoint) { // we need to disconnect camera from canvas
                    setTimeout(function () {
                        camera.detachControl(canvas);
                    }, 0);
                }
            }
        };

        var onPointerUp = function () {
            if (startingPoint) {
                camera.attachControl(canvas, true);
                startingPoint = null;
                return;
            }
        };

        var onPointerMove = function (evt) {
            if (!startingPoint) {
                return;
            }

            var current = getGroundPosition(evt);

            if (!current) {
                return;
            }

            var diff = current.subtract(startingPoint);
            // var vector = new BABYLON.Vector3(diff.x, diff.y, diff.z);

            // if (currentMesh.intersectsMesh(anotherMesh, true)) {
            //     currentMesh.material.diffuseColor = new BABYLON.Color3(1, 0, 0);
            //
            //     // currentMesh.material.wireframe = true;
            //
            // } else {
            //     currentMesh.material.diffuseColor = new BABYLON.Color3(0, 0.5, 0.3);
            //     currentMesh.position.addInPlace(diff);
            //     startingPoint = current;
            // }

            var isIntersect = false;

            for (var i = 0; i < legMeshVertices.length; i++) {
                // legMeshVertices.some(function (point) {
                if (currentMesh.intersectsPoint(legMeshVertices[i])) {

                    var origin = BABYLON.Mesh.CreateSphere("origin", 4, 0.1, scene);
                    origin.position = legMeshVertices[i];

                    isIntersect = true;
                    console.log(isIntersect);
                    break;
                    // currentMesh.material.diffuseColor = new BABYLON.Color3(1, 0, 0);
                } else {
                    // isIntersect = false;
                    // currentMesh.material.diffuseColor = new BABYLON.Color3(0, 0.5, 0.3);
                }
                // });
            }


            if (isIntersect) {
                currentMesh.material.diffuseColor = new BABYLON.Color3(1, 0, 0);
            } else {
                currentMesh.material.diffuseColor = new BABYLON.Color3(0, 0.5, 0.3);
                currentMesh.position.addInPlace(diff);
                startingPoint = current;
            }


        };

        canvas.addEventListener("pointerdown", onPointerDown, false);
        canvas.addEventListener("pointerup", onPointerUp, false);
        canvas.addEventListener("pointermove", onPointerMove, false);

        scene.onDispose = function () {
            canvas.removeEventListener("pointerdown", onPointerDown);
            canvas.removeEventListener("pointerup", onPointerUp);
            canvas.removeEventListener("pointermove", onPointerMove);
        };

        // return the created scene
        return scene;
    };

    // call the createScene function
    var scene = createScene(canvas);

    // run the render loop
    engine.runRenderLoop(function () {
        scene.render();
    });

    // the canvas/window resize event handler
    window.addEventListener('resize', function () {
        engine.resize();
    });
}

function addGUI() {
    var GUIConfig = function () {
        this.Wireframe = true;
        this.Alpha = ground.material.alpha;
        this.Color = [ground.material.diffuseColor.r * 255,
            ground.material.diffuseColor.g * 255,
            ground.material.diffuseColor.b * 255]
    };

    var GUI = new dat.GUI();
    var config = new GUIConfig();

    GUI['objects'] = GUI.addFolder('Objects');
    GUI['objects'].add(config, "Wireframe")
        .onChange(function (value) {
            objects.forEach(function (mesh) {
                mesh.material.wireframe = value;
                mesh.material.transparent = value;
            });

            ground.material.wireframe = value
        });

    GUI['ground'] = GUI.addFolder('Ground');
    GUI['ground'].add(config, "Alpha", 0.0, 1.0)
        .onChange(function (value) {
            ground.material.alpha = value;
        });
    GUI['ground'].addColor(config, 'Color')
        .onChange(function (value) {
            ground.material.diffuseColor = new BABYLON.Color3(value[0] / 255, value[1] / 255, value[2] / 255);
        });
}

function createGround(scene) {
    var lines = [];
    var countOfSplitting = 50;
    var startPoint = -10;
    var endPoint = startPoint * -1;
    // var step = (Math.abs(startPoint) + Math.abs(endPoint)) / countOfSplitting;

    for (var i = startPoint; i <= endPoint; i++) {
        var points = [
            new BABYLON.Vector3(i, 0, startPoint),
            new BABYLON.Vector3(i, 0, endPoint)
        ];
        lines.push(BABYLON.MeshBuilder.CreateLines("lines", {points: points}, scene));
    }

    for (var j = startPoint; j <= endPoint; j++) {
        var points = [
            new BABYLON.Vector3(startPoint, 0, j),
            new BABYLON.Vector3(endPoint, 0, j)
        ];
        lines.push(BABYLON.MeshBuilder.CreateLines("lines", {points: points}, scene));
    }

    // lines.forEach(function (line) {
    //     line.freezeWorldMatrix();
    // });

    // create a built-in "ground" shape;
    var ground = BABYLON.Mesh.CreateGround("GridLevelWater", 10, 10, 0, scene, false);
    var materialGround = new BABYLON.StandardMaterial("Mat", scene);
    materialGround.diffuseColor = new BABYLON.Color3.FromHexString("#8ffff0");
    materialGround.alpha = 0.7;
    ground.material = materialGround;

    this.ground = ground;

    return ground;
}


function getAnotherItemFromArray(array, curItem) {
    var newArray = array.filter(function (value, index) {
        return array[index] !== curItem;
    });
    return newArray[0];
}

function uniqBy(a, key) {
    var index = [];
    return a.filter(function (item) {
        var k = key(item);
        return index.indexOf(k) >= 0 ? false : index.push(k);
    });
}

