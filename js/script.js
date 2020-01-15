import * as THREE from '../vendor/three.js-master/build/three.module.js';
import Stats from '../vendor/three.js-master/examples/jsm/libs/stats.module.js';
import { OrbitControls } from '../vendor/three.js-master/examples/jsm/controls/OrbitControls.js';
import { FBXLoader } from '../vendor/three.js-master/examples/jsm/loaders/FBXLoader.js';


const Scene = {
	vars: {
		container: null,
		scene: null,
		renderer: null,
		camera: null,
		stats: null,
		controls: null,
		texture: null,
		mouse: new THREE.Vector2(),
		raycaster: new THREE.Raycaster(),
		time:0,
		click: false,
		posInit: false,
		launchMusic: false,
		cibleSouris: false,
	},
	animate: () => {		
		requestAnimationFrame(Scene.animate);
		Scene.vars.raycaster.setFromCamera(Scene.vars.mouse, Scene.vars.camera);

		Scene.customAnimation();

		if (Scene.vars.project !== undefined) {
			let intersects = Scene.vars.raycaster.intersectObjects(Scene.vars.project.children, true);

			if( intersects.length >= 1){
				if(intersects[0].object.name == "Earth" || intersects[0].object.name == "Moon"){
					Scene.vars.cibleSouris = true;
				}
				else{
					Scene.vars.cibleSouris = false;
				}
			}
			else{
				Scene.vars.cibleSouris = false;
			}
		}

		Scene.render();
	},
	render: () => {
		Scene.vars.renderer.render(Scene.vars.scene, Scene.vars.camera);
		Scene.vars.stats.update();
	},
	customAnimation: () => {
		let vars = Scene.vars;

		if(Scene.vars.terre != undefined){
			Scene.vars.terre.rotation.y += 0.0008; 
		}

		if(vars.lune != undefined){
			vars.lune.rotation.y += 0.003; 

			let ω = Math.PI/10;

			vars.time += 0.015;

			vars.lune.position.x = 10000 * Math.sin(ω*vars.time);
			vars.lune.position.z = 10000 * Math.cos(ω*vars.time);
		}

		if(vars.rocketAnimation != undefined){
			let ω = Math.PI/8.56;

			let x = 500 * Math.sin(ω*vars.time);
			let z = 500 * Math.cos(ω*vars.time);
			
			if(vars.click && !vars.posInit ){

				vars.rocket.position.x = 0;
				vars.rocket.position.z = 0;
				vars.rocket.position.y = 0;
				
				vars.rocketAnimation.position.x = x;
				vars.rocketAnimation.position.z = z;
				vars.posInit = true;
			}

			if(vars.posInit){
				vars.rocketAnimation.position.y += 0.3;
				
				if(!vars.launchMusic){
					// create an AudioListener and add it to the camera
					var listener = new THREE.AudioListener();
					vars.camera.add( listener );

					// create a global audio source
					var sound = new THREE.Audio( listener );

					// load a sound and set it as the Audio object's buffer
					var audioLoader = new THREE.AudioLoader();
					audioLoader.load( 'musique/ducktales_music_nes_the_moon_theme.mp3', function( buffer ) {
						sound.setBuffer( buffer );
						sound.setLoop( true );
						sound.setVolume( 0.5 );
						sound.play();
					});

					vars.launchMusic = true;
				}
			}
		}
	},
	loadFBX: (file, scale, position, rotation, color, namespace, callback) => {
		let vars = Scene.vars;
		let loader = new FBXLoader();

		if (file === undefined) {
			return;
		}

		loader.load('./fbx/' + file, (object) => {

			object.traverse((child) => {
				if (child.isMesh) {

					child.castShadow = true;
					child.receiveShadow = true;

					if (namespace === "lune") {
						child.material = new THREE.MeshBasicMaterial({
							map: vars.textureLune
						});
					}

					child.material.color = new THREE.Color(color);
				}
			});

			object.position.x = position[0];
			object.position.y = position[1];
			object.position.z = position[2];

			object.rotation.x = rotation[0];
			object.rotation.y = rotation[1];
			object.rotation.z = rotation[2];

			object.scale.x = object.scale.y = object.scale.z = scale;
			Scene.vars[namespace] = object;

			callback();
		});
		
	},
	onWindowResize: () => {
		let vars = Scene.vars;
		vars.camera.aspect = window.innerWidth / window.innerHeight;
		vars.camera.updateProjectionMatrix();
		vars.renderer.setSize(window.innerWidth, window.innerHeight);
	},
	onMouseMove: (event) => {
		Scene.vars.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
		Scene.vars.mouse.y = -(event.clientY / window.innerHeight ) * 2 + 1;
	},
	onMouseClick: () => {

		//Verification si le clic est sur la lune
		if(Scene.vars.cibleSouris){
			Scene.vars.click = true;
		}
	},
	init: () => {
		let vars = Scene.vars;

		// Préparer le container pour la scène
		vars.container = document.createElement('div');
		vars.container.classList.add('fullscreen');
		document.body.appendChild(vars.container);

		// ajout de la scène
		vars.scene = new THREE.Scene();
		vars.scene.background = new THREE.Color(0xa0a0a0);
		//vars.scene.fog = new THREE.Fog(vars.scene.background, 500, 4000);

		// paramétrage du moteur de rendu
		vars.renderer = new THREE.WebGLRenderer({ antialias: true });
		vars.renderer.setPixelRatio(window.devicePixelRatio);
		vars.renderer.setSize(window.innerWidth, window.innerHeight);
		
		vars.renderer.shadowMap.enabled = true;
		vars.renderer.shadowMapSoft = true;

		vars.container.appendChild(vars.renderer.domElement);

		// ajout de la caméra
		vars.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 10000);
		vars.camera.position.set(-1.5, 210, 572);

		// ajout de la lumière
		const lightIntensityHemisphere = .5;
		let light = new THREE.HemisphereLight(0xFFFFFF, 0x444444, lightIntensityHemisphere);
		light.position.set(0, 700, 0);
		vars.scene.add(light);

		let light2 = new THREE.HemisphereLight(0xFFFFFF, 0x444444, lightIntensityHemisphere);
		light2.position.set(0, -700, 0);
		vars.scene.add(light2);

		vars.textureSphere = new THREE.TextureLoader().load('./texture/sphere.jpg');

		// ajout de la sphère
		let geometry = new THREE.SphereGeometry(5000, 32, 32);
		let material = new THREE.MeshBasicMaterial({map: vars.textureSphere});
		material.side = THREE.BackSide;
		let sphere = new THREE.Mesh(geometry, material);
		vars.scene.add(sphere);

		vars.textureLune = new THREE.TextureLoader().load('./texture/lune.jpeg');

		let hash = document.location.hash.substr(1);
		if (hash.length !== 0) {
			let text = hash.substring();
			Scene.vars.text = decodeURI(text);
		}

		Scene.loadFBX("Terre.FBX", 0.05, [0, 100, 0], [0, 0, 0], 0xFFFFFF, 'terre', () => {
			Scene.loadFBX("Rocket.FBX", 0.005, [0, 151, 0], [0, 0, 0], 0xFFFFFF, 'rocketAnimation', () => {
				Scene.loadFBX("Rocket.FBX", 0.01, [0, 93, 0], [0, 0, 0], 0xFFFFFF, 'rocket', () => {
					Scene.loadFBX("Lune.FBX", 10, [10000, 100, 0], [0, 0, 0], 0xFFFFFF, 'lune', () => {
				
						let vars = Scene.vars;
						let project = new THREE.Group();
						vars.lune.remove(vars.lune.children[2]);
						vars.lune.children[0].name = "Moon";
						vars.rocket.remove(vars.rocket.children[20]);
						vars.rocket.remove(vars.rocketAnimation.children[20]);
						vars.rocketAnimation.remove(vars.rocketAnimation.children[20]);
						vars.lune.add(vars.rocket);
						vars.terre.add(vars.lune);
						project.add(vars.terre);
						project.add(vars.rocketAnimation);
						vars.scene.add(project);
						vars.project = project;

						let elem = document.querySelector('#loading');
						elem.parentNode.removeChild(elem);
					});
				});
			});
		});
		
		// ajout des controles
		vars.controls = new OrbitControls(vars.camera, vars.renderer.domElement);
		vars.controls.minDistance = 300;
		vars.controls.maxDistance = 4000;
		vars.controls.target.set(0, 100, 0);
		vars.controls.update();

		window.addEventListener('resize', Scene.onWindowResize, false);
		window.addEventListener('mousemove', Scene.onMouseMove, false);
		window.addEventListener('mousedown', Scene.onMouseClick, false );

		vars.stats = new Stats();
		vars.container.appendChild(vars.stats.dom);

		Scene.animate();
	}
};

Scene.init();