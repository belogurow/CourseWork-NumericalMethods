// Global variables
var ground;
var scene;
var engine;
var objects = [];
var legMeshVertices = [];
var cubeMeshVertices = [];
var GUI, GUIConfig;
var leg;

var enableCollision = true;
var currentMesh = undefined;

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
    engine = new BABYLON.Engine(canvas, true);

    // createScene function that creates and return the scene
    var createScene = function (canvas) {
        // create a basic BJS Scene object
        var scene = new BABYLON.Scene(engine);
        // scene.gravity = new BABYLON.Vector3(0, -9.81, 0);


        // create a FreeCamera, and set its position to (x:0, y:5, z:-10)
        var camera = new BABYLON.FreeCamera('camera1', new BABYLON.Vector3(2, 7, 10), scene);
        // var camera = new BABYLON.ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 4, 10, BABYLON.Vector3(0, 15,-20), scene);
        // camera.setTarget(new BABYLON.Vector3(, 0, 10));
        // camera.attachControl(this.canvas);

        // target the camera to scene origin
        camera.setTarget(BABYLON.Vector3.Zero());

        // attach the camera to the canvas
        camera.attachControl(canvas, true);

        // create a basic light, aiming 0,1,0 - meaning, to the sky
        var light1 = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(1, 1, 0), scene);
        // var light2 = new BABYLON.PointLight("light2", new BABYLON.Vector3(0, 1, -1), scene);

        // create a built-in "sphere" shape; its constructor takes 6 params: name, segment, diameter, scene, updatable, sideOrientation
        // var sphere = BABYLON.Mesh.CreateSphere('sphere1', 16, 2, scene);
        // objects.push(sphere);
        // var sphere1 = BABYLON.Mesh.CreateSphere('sphere2', 16, 5, scene);
        // objects.push(sphere1)
        // var sphere1 = BABYLON.Mesh.CreateSphere('sphere2', 16, 5, scene);


        var ground = createGround(scene);
        importMeshes(scene);

        // Events

        var startingPoint;
        var anotherMesh;

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
                return mesh !== ground && mesh !== leg;
            });
            if (pickInfo.hit) {
                currentMesh = pickInfo.pickedMesh;
                addFolderCurrentMesh();
                // anotherMesh = getAnotherItemFromArray(objects, currentMesh);

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

            if (!enableCollision) {

                var isIntersect = false;

                for (var i = 0; i < legMeshVertices.length; i++) {
                    if (currentMesh.intersectsPoint(legMeshVertices[i])) {
                        isIntersect = true;
                        break;
                    }
                }

                if (isIntersect) {
                    currentMesh.material.diffuseColor = new BABYLON.Color3(1, 0, 0);
                } else {
                    currentMesh.material.diffuseColor = new BABYLON.Color3(0, 0.5, 0.3);
                    currentMesh.position.addInPlace(diff);
                    startingPoint = current;
                }
            } else {
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
    scene = createScene(canvas);

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
    var config = function () {
        this.Wireframe = false;
        this.GridRatio = ground.material.gridRatio;
        this.Opacity = ground.material.opacity;
        this.EnableCollision = enableCollision;
        this.Operation = 0;
        this.RotationX = 0;
        this.RotationY = 0;
        this.RotationZ = 0;
        this.Alpha = 1;
        // this.Color = [ground.material.diffuseColor.r * 255,
        //     ground.material.diffuseColor.g * 255,
        //     ground.material.diffuseColor.b * 255]
    };

    GUI = new dat.GUI();
    GUIConfig = new config();

    GUI['objects'] = GUI.addFolder('Objects');
    GUI['objects'].add(GUIConfig, "Wireframe")
        .onChange(function (value) {
            objects.forEach(function (mesh) {
                mesh.material.wireframe = value;
                mesh.material.transparent = value;
            });
        });

    GUI['objects'].add(GUIConfig, "EnableCollision")
        .onChange(function (value) {
            enableCollision = value;
            // execEnableCollision(GUI, config);

            if (enableCollision) {
                currentMesh.material.diffuseColor = new BABYLON.Color3(0, 0.5, 0.3);
            }
        });
    GUI['objects'].open();

    GUI['ground'] = GUI.addFolder('Ground');
    GUI['ground'].add(GUIConfig, "GridRatio", 0.0, 1.0)
        .onChange(function (value) {
            ground.material.gridRatio = value;
        });
    GUI['ground'].add(GUIConfig, "Opacity", 0.0, 1.0)
        .onChange(function (value) {
            ground.material.opacity = value;
        });


    // execEnableCollision(GUI, GUIConfig)
}

function execEnableCollision(GUI, config) {
    if (enableCollision) {
        GUI['Collision'] = GUI.addFolder('Collision');
        // GUI['Collision'].add(config, 'Operation', {Empty: 0, Union: 1, Intersection: 2, Subtraction: 3})
        //     .onChange(function (value) {
        //         console.log(value);
        //         showMesh(value);
        //     });

        GUI['Collision'].open()
    } else {
        GUI.removeFolder('Collision')
    }
}

function addFolderCurrentMesh() {
    if (currentMesh !== undefined && GUI['Prosthesis'] === undefined) {
        GUI['Prosthesis'] = GUI.addFolder('Prosthesis');
        GUI['Prosthesis'].add(GUIConfig, 'RotationX', 0, 360)
            .onChange(function (value) {
                currentMesh.rotation.x = value * Math.PI / 180
            });
        GUI['Prosthesis'].add(GUIConfig, 'RotationY', 0, 360)
            .onChange(function (value) {
                currentMesh.rotation.y = value * Math.PI / 180
            });
        GUI['Prosthesis'].add(GUIConfig, 'RotationZ', 0, 360)
            .onChange(function (value) {
                currentMesh.rotation.z = value * Math.PI / 180
            })
    }

}

function createGround(scene) {
    ground = BABYLON.Mesh.CreateGround("ground", 200, 200, 0, scene, false);
    var materialGround = new BABYLON.GridMaterial("Grid", scene);
    materialGround.gridRatio = 1;
    materialGround.majorUnitFrequency = 2;
    materialGround.minorUnitVisibility = 0.1;
    materialGround.opacity = 0.2;

    ground.material = materialGround;
    return ground;
}

function importMeshes(scene) {
    engine.displayLoadingUI();
    // Skin
    BABYLON.SceneLoader.ImportMesh("", "../stl_models/", "Skin.stl", scene, function (newMeshes) {
        var mesh = newMeshes[0];
        // mesh.position.x = ;

        mesh.position.z = 1;
        mesh.freezeWorldMatrix();

        // mesh.scaling.multiply(new BABYLON.Vector3(20, 20, 20));

        var myMaterial = new BABYLON.StandardMaterial("myMaterial", scene);

        myMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.4, 0.3);
        mesh.material = myMaterial;
        mesh.setVerticesData(BABYLON.VertexBuffer.UVKind, []);
        objects.push(mesh);
        leg = mesh;

        // var vertexData = BABYLON.VertexData.ExtractFromMesh(mesh);
        // var positions = vertexData.positions;
        // var numberOfPoints = positions.length / 3;
        // for (var i = 0; i < numberOfPoints; i++) {
        //     var p = new BABYLON.Vector3(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
        //     cubeMeshVertices.push(p);
        // }
        // var a = 0;
        engine.hideLoadingUI();
        GUI['Leg'] = GUI.addFolder('Leg');
        GUI['Leg'].add(GUIConfig, "Alpha", 0.0, 1.0)
            .onChange(function (value) {
                leg.material.alpha = value;
            });
    });

    // Cube
    BABYLON.SceneLoader.ImportMesh("", "../stl_models/", "Cube.stl", scene, function (newMeshes) {
        var mesh = newMeshes[0];
        var myMaterial = new BABYLON.StandardMaterial("myMaterial", scene);

        myMaterial.diffuseColor = new BABYLON.Color3(0, 0.5, 0.3);
        mesh.material = myMaterial;
        mesh.setVerticesData(BABYLON.VertexBuffer.UVKind, []);
        objects.push(mesh);
    });


    // Leg
    BABYLON.SceneLoader.ImportMesh("", "../stl_models/", "bone4.stl", scene, function (newMeshes) {
        var mesh = newMeshes[0];
        mesh.setVerticesData(BABYLON.VertexBuffer.UVKind, []);
        // mesh.rotation.x = 270 * Math.PI / 180;

        // mesh.position.y += 2;

        mesh.freezeWorldMatrix();
        // leg = mesh;
        // mesh.freezeWorldMatrix();
        // mesh.position.y = 1;
        // mesh.rotate(BABYLON.Axis.Z, Math.PI, BABYLON.Space.WORLD);


        var myMaterial = new BABYLON.StandardMaterial("myMaterial", scene);

        myMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1);
        // myMaterial.specularColor = new BABYLON.Color3(0.5, 0.6, 0.87);
        myMaterial.freeze();


        // myMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
        // myMaterial.ambientColor = new BABYLON.Color3(0.23, 0.98, 0.53);

        mesh.material = myMaterial;
        objects.push(mesh);

        var vertexData = BABYLON.VertexData.ExtractFromMesh(mesh);
        var positions = vertexData.positions;
        var numberOfPoints = positions.length / 3;
        for (var i = 0; i < numberOfPoints; i++) {
            var p = new BABYLON.Vector3(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
            legMeshVertices.push(p);
        }

        legMeshVertices = uniqBy(legMeshVertices, JSON.stringify);


    });


    // Cylinder
    // var cone = BABYLON.MeshBuilder.CreateCylinder("cone", {diameter: 0.5, tessellation: 30}, scene);
    // cone.position.y += 2;
    // cone.material = new BABYLON.StandardMaterial("myMaterial", scene);
    // cone.diffuseColor = new BABYLON.Color3(0, 1, 0);
    // objects.push(cone);
}

function showMesh(operation) {
    if (operation === '0') {

    } else {
        if (objects.length !== 2) {
            throw new Error("Wrong size of objects array: " + meshes.length)
        }

        engine.displayLoadingUI();
        engine.stopRenderLoop();

        var mesh2 = objects.pop(),
            mesh1 = objects.pop();

        console.log(mesh2);

        var meshCSG1 = BABYLON.CSG.FromMesh(mesh1),
            meshCSG2 = BABYLON.CSG.FromMesh(mesh2),
            result;


        switch (operation) {
            case '1':
            default:
                result = meshCSG1.union(meshCSG2);
                break;
            case '2':
                result = meshCSG1.intersect(meshCSG2);
                break;
            case '3':
                result = meshCSG1.subtract(meshCSG2);
                break;
        }

        mesh2.dispose();
        mesh1.dispose();
        console.log(scene);

        var resultMesh = result.toMesh("csg", new BABYLON.StandardMaterial("mat", scene), scene);
        console.log(resultMesh);
        objects.push(resultMesh);

        engine.runRenderLoop(function () {
            scene.render();
        });
        engine.hideLoadingUI();

    }
}


function getAnotherItemFromArray(array, curItem) {
    var newArray = array.filter(function (value, index) {
        return array[index] !== curItem;
    });
    return newArray[0];
}

function uniqBy(verticies, key) {
    var index = [];
    return verticies.filter(function (item) {
        var k = key(item);
        return index.indexOf(k) >= 0 ? false : index.push(k);
    });
}

