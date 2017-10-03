/* Extension Chrome pour Jeedom (@Noodom) */

/* TODO List
- import/export des elements affiches dans l'extension
- ajouter des nouveaux type (boutons, interactions, scenarios, ifttt ..)
- ajout de liens vers forums (lecture de la liste depuis le fichier de config)
*/

//
// Paramètres de l'application : voir parametres.js
//

document.getElementById('helpBanner').innerHTML='Extension Chrome Jeedom - v' + version + ' - @Noodom';

var listeJeedom = "";
var listeActionsJeedom = "";
var jsonJeedom = [];

var xhttp = null;

function loadHTTPRequest(url, cfunc, indG, indE) {

	// Annulation de la requête précédente si en cours
	if (xhttp && xhttp.readyState != 0) {
		xhttp.abort();
	}

	xhttp = new XMLHttpRequest();

	xhttp.onreadystatechange = function() {

		if (xhttp.readyState === XMLHttpRequest.DONE) {

			// traitement de la reponse
			if (xhttp.status == 200 || xhttp.status == 401) {
				// affichage du resultat de la commande Jeedom=
				cfunc(xhttp.responseText, indG, indE);
			}
			else {
				// Erreur de récupération de la reponse
				cfunc("Erreur de récupération de la commande (status HTTP : " + xhttp.status + ")", -1);
			}
		}
		else {
			// récupération de la reponse en cours
			cfunc("En cours de récupération de la commande..", -1);
		}
	};

	// Report errors if they happen during xhttp
	xhttp.addEventListener("error", function (e) {
		cfunc ("Erreur de récupération de la commande : " + e, -1);
	}, false);

	xhttp.open("GET", url, false);
	xhttp.send();
}

function addBefore(nomGroupe) {
	// initialise la liste des boutons Action
	listeActionsJeedom = "";
	listeJeedom += "<div id=\"idElements\" class=\"panel panel-primary\" style=\"margin-top:10px;margin-left:10px;margin-right:10px\">"
		+ "<div class=\"panel-heading\">"
			+ "<h3 class=\"panel-title\">" + nomGroupe+ "</h3>"
		+ "</div>"
		+ "<div class=\"panel-body\">"
			+ "<div class=\"container\" style=\"margin-left:30px;\">"
			+ "<ul class=\"custom-bullet\">"
}

function addAfter() {
	// Ajoute les boutons Action
	listeJeedom += "<li>" + listeActionsJeedom + "</li>";
	listeActionsJeedom = "";
	// Fin de l'ajout de l'élément courant
	listeJeedom += "</ul>"
		+ "</div>"
		+ "</div>"
		+ "</div>";
}

function retourCommande(result, status) {
	// TODO : voir traitement à faire après exécution action
	if (status != -1) {
		console.log('retour de la commande d\'action' + result);
	}
}

function initJeedomElement(result, name, unite) {
	if (name != -1) {
		listeJeedom += '<li>' + name + ' : ' + result + ' ' + unite + '</li>';
	}
}

 function initJeedomAction(id, name) {
	listeActionsJeedom += '<button id="action' + id + '" class="btn btn-info btn-sm actionButton" style="margin-left:15px;"><span class="glyphicon glyphicon-share-alt"></span>&nbsp;' + name + '</button>';
}
function sendMessage(msg) {
	// A tab has be selected for the message to be sent
	var params = {
		active: true,
		currentWindow: true
	}

	// Recherche de l'onglet actif dans la fenêtre Chrome courante
	chrome.tabs.query(params, gotTabs);

	// Onglet récupéré
	function gotTabs(tabs) {

	console.log("connecting..");
	var port = chrome.extension.connect({name: "Sample Communication"});
	port.postMessage(msg);

	// Réception de message de background (inutilisé pour le moment)
	port.onMessage.addListener(function(msg) {
		console.log("message received : "+ msg);
	});
	}
}

function lanceUrlDepuisPopup(monUrl) {
	var msg = {
		from : 'popup_url',
		urlDestination : monUrl
	}

	sendMessage(msg);
}

function lanceOptions() {
	lanceUrlDepuisPopup(chrome.runtime.getURL('/html/options.html'), false);
}

$("#addons").on('click', function(){
		// Ouverture de la page des options
		lanceOptions();
});

function getCurrentTab(){
    return new Promise(function(resolve, reject){
      chrome.tabs.query({
        active: true,               // Select active tabs
        lastFocusedWindow: true     // In the current window
      }, function(tabs) {
        resolve(tabs[0]);
      });
    });
}

// Gestion des boutons
document.addEventListener('DOMContentLoaded', function() {

	// Duree d'affichage des notifications
	//var dureeNotification = 500;

	// Chargement du contexte Jeedom
	var jeedomUrl = Config.get("jeedomUrl");
	console.log("Url jeedom :: " + Config.get("jeedomUrl"))
	var jeedomApiKey = Config.get("jeedomApiKey");
	console.log("Api Key jeedom :: " + Config.get("jeedomApiKey"))

	// Affichage des retours par notification
	if (Config.get("retourParNotification") === null) {
		Config.set("retourParNotification", "true");
	}

	function initialisationDonnees() {
		var url = "";
		listeJeedom = "";

		if (jeedomUrl != null && jeedomApiKey != null) {
			// Construction de l onglet Jeedom
			if (Config.get('jeedomElements') != null && Config.get('jeedomElements') != "null") {
				// lecture des éléments sélectionnés dans la page des options (piece/element/cmd/id)
				var elementsJeedom = Config.get('jeedomElements').split(',');
				var nbElements = elementsJeedom.length;
				// element courant 'contenu séparé par des /
				var currentElement = "";
				// Nom de l'element courant
				var currentElementName = "";
				// liste des parametres de l element courant
				var detailElement = "";

				for (var indElement=0;indElement<nbElements;indElement++) {

					// Element courant
					currentElement = elementsJeedom[indElement];
					detailElement = currentElement.split('/');

					// ex : info/Chambre/Thermostat/Consigne/2537/°C
					console.log ('ajout de ' + elementsJeedom[indElement] + ' : ' + currentElementName + '--' +detailElement[detailElement.length-4]);
					if (indElement != 0 && currentElementName != detailElement[detailElement.length-5]+'//'+detailElement[detailElement.length-4]) {
						currentElement = detailElement[detailElement.length-4];
						addAfter();
					}


					if (currentElementName != detailElement[detailElement.length-5]+'//'+detailElement[detailElement.length-4]) {
						currentElementName = detailElement[detailElement.length-5]+'//'+detailElement[detailElement.length-4];
						addBefore('[' + detailElement[detailElement.length-5]+'] '+detailElement[detailElement.length-4]);
					}

					// Prise en compte du type de l'élément Jeedom
					if (detailElement[detailElement.length-6] == 'info') {
						// type info
						url = jeedomUrl + "/core/api/jeeApi.php?apikey=" + jeedomApiKey + "&type=cmd&id=" +
						detailElement[detailElement.length-2];
						// Récupération de la valeur des champs Jeedom
						loadHTTPRequest(url, initJeedomElement, detailElement[detailElement.length-3], detailElement[detailElement.length-1]);
					}
					else if (detailElement[detailElement.length-6] == 'action') {
						// type action : affichage du bouton de commande
						initJeedomAction(detailElement[detailElement.length-2], detailElement[detailElement.length-3]);
					}
				}
				if (nbElements > 0) {
					addAfter();
				}
			}

			document.getElementById('listeJeedom').innerHTML=listeJeedom;
		}
	}

	function executerRequete(callback) {
		// on vérifie si la liste des elements a déjà été chargée pour n'exécuter la requête AJAX qu'une seule fois
		// (A voir pour optimisation future : utilisation de sessionElements)
		if (Config.get('sessionElements') != null && Config.get('sessionElements') != "null") {
			jsonJeedom = JSON.parse(localStorage.getItem('sessionElements'));
			callback();
		}
		else {
				// On lance la fonction de callback avec les parametres déjà récupérés précédemment
				callback();
		}
	}

	// Inutilisé actuellement (attente optimisations)
	function emptyElements() {
		localStorage.setItem('sessionElements', null);
		window.location = window.location;
	}

	// On initialise les données Jeedom
	initialisationDonnees();

	// Voir pour une utilisation future
	chrome.browserAction.setBadgeText ( { text: "" } );
	chrome.browserAction.setTitle ( { title: "" } );

	function lanceCommande(comm, param) {
		var msg = {
			from : comm,
			param : param
		}

		sendMessage(msg);
  }

  function envoiNotification(titre, contenu) {
		var msg = {
			from : 'popup_notification',
			titre : titre,
			contenu : contenu
		}

		sendMessage(msg);
  }

	// Liens divers
	function selectionLien(urlLien, notification) {
		lanceUrlDepuisPopup(urlLien);
		envoiNotification('Jeedom', notification);
	}

	function lanceMonJeedom() {
		var jeedomUrl = Config.get("jeedomUrl");
		var jeedomApiKey = Config.get("jeedomApiKey");
		if (jeedomUrl != null) {
			selectionLien(jeedomUrl, 'Lancement de mon Jeedom');
		}
		else {
			lanceOptions();
		}
	}

	function lanceForumExtensionChrome() {
		selectionLien('https://www.jeedom.com/forum/viewtopic.php?f=24&t=29573', 'Lancement du forum Jeedom, discussion sur l extension Chrome Jeedom');
	}

	var forumJeedomButton = document.getElementById('forumJeedom');
	forumJeedomButton.addEventListener('click', function() {
		selectionLien('http://forum.jeedom.com', 'Lancement du forum Jeedom.');
	}, false);

	var siteJeedomButton = document.getElementById('siteJeedom');
	siteJeedomButton.addEventListener('click', function() {
		selectionLien('http://www.jeedom.com', 'Lancement du site Jeedom');
	}, false);

	var twitterJeedomButton = document.getElementById('twitterJeedom');
	twitterJeedomButton.addEventListener('click', function() {
		selectionLien('https://twitter.com/search?q=jeedom', 'Lancement de la recherche Jeedom sur Twitter');
	}, false);

	var documentationJeedomButton = document.getElementById('documentationJeedom');
	documentationJeedomButton.addEventListener('click', function() {
		selectionLien('https://jeedom.github.io/documentation/', 'Lancement de la documentation Jeedom');
	}, false);

	var githubJeedomButton = document.getElementById('githubJeedom');
	githubJeedomButton.addEventListener('click', function() {
		selectionLien('https://www.github.com/jeedom/', 'Lancement du github Jeedom');
	}, false);

	////////////////
  // Recherches /
  //////////////

  // Bouton Recherche Forum
	var rechercheForumButton = document.getElementById('rechercheForumButton');
  var rechercheForum = document.getElementById('rechercheForum');

	function rechercheForumJeedom (rechercheForum) {
		selectionLien('https://www.jeedom.com/forum/search.php?keywords=' + encodeURI(rechercheForum), 'Recherche de ' + rechercheForum + ' dans le forum Jeedom');
	}

  rechercheForum.addEventListener('keypress', function(e) {
		var key = e.which || e.keyCode;
    if (key === 13) { // enter
			rechercheForumJeedom(rechercheForum.value);
    }
	});

	rechercheForumButton.addEventListener('click', function() {
  	rechercheForumJeedom(rechercheForum.value);
	}, false);

	////////////////
  // Aide ///////
  //////////////

	// Bouton mon Jeedom
  var monJeedomButton = document.getElementById('monJeedom');
  monJeedomButton.addEventListener('click', function() {
	  // lance la page de mon Jeedom depuis l'extension Chrome Jeedom
	  lanceMonJeedom();
  }, false);

	// Bouton aide Forum
  var aideForumButton = document.getElementById('aideForum');
  aideForumButton.addEventListener('click', function() {
	  // lance le forum Jeedom sur le sujet de l'extension Chrome
	  lanceForumExtensionChrome();
  }, false);

	// Gestion des touches de raccourcis
	// Raccourcis generaux
	Mousetrap.bind(['alt+shift+1'], function(e) {
		// Lancement de Jeedom
		lanceMonJeedom();
		return false;
  });
	Mousetrap.bind(['alt+shift+2'], function(e) {
		// Lancement du forum Jeedom
		selectionLien('http://forum.jeedom.com', 'Lancement du forum Jeedom.');
		return false;
  });
	Mousetrap.bind(['alt+shift+3'], function(e) {
		// Lancement de la documentation Jeedom
		selectionLien('http://www.jeedom.com', 'Lancement du site Jeedom');
		return false;
  });

	// Raccourcis recherches
	Mousetrap.bind(['f o r'], function(e) {
		$('.nav-tabs a[href="#navRecherches"]').tab('show');
		setTimeout(
			function(){
				rechercheForum.focus();
			},
			500);
		return false;
  });

	// Raccourcis onglets
	Mousetrap.bind(['alt+r'], function(e) {
		$('.nav-tabs a[href="#navRecherches"]').tab('show');
		return false;
	});
	Mousetrap.bind(['alt+l'], function(e) {
		$('.nav-tabs a[href="#navLiens"]').tab('show');
		return false;
	});
	Mousetrap.bind(['alt+a'], function(e) {
		$('.nav-tabs a[href="#navAide"]').tab('show');
		return false;
	});

	$('.actionButton').click(function() {
	     // traitement de la commande actionXXX (XXX : id de la commande a exécuter)
			 if (this.id.substring(0,6) == 'action') {
				 var idCmd = this.id.substring(6);
				 var url = jeedomUrl + "/core/api/jeeApi.php?apikey=" + jeedomApiKey + "&type=cmd&id=" + idCmd;
			 	loadHTTPRequest(url, retourCommande, status);
			 }
	 })
}, false);
