/* Extension Chrome pour Jeedom (@noodom) */

/* TODO List
- voir problèmes caractères spéciaux dans le fichier de config
- interroger Jeedom pour récupérer la liste des elements Jeedom disponibles
- ajouter la possibilité d'édition des groupes
- import/export des elements affiches dans l'extension
- ajouter des nouveaux type (boutons, interactions, scenarios, ifttt ..)
- recherche/filtres sur les éléments (avec liste des possibilités affichées en live)
- ajout de liens vers forums (lecture de la liste depuis le fichier de config)
*/

//
// Paramètres de l'application : voir parametres.js
//

var listeJeedom = "";
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
	listeJeedom += "<div id=\"idElements\" class=\"panel panel-primary\" style=\"margin-top:10px;margin-left:10px;margin-right:10px\">"
		+ "<div class=\"panel-heading\">"
			+ "<h3 class=\"panel-title\">" + nomGroupe+ "</h3>"
		+ "</div>"
		+ "<div class=\"panel-body\">"
			+ "<div class=\"container\" style=\"margin-left:30px;\">"
			+ "<ul class=\"custom-bullet\">"
}

function addAfter() {
	// fin liste 1
	listeJeedom += "</ul>"
		+ "</div>"
		+ "</div>"
		+ "</div>";
}

function initJeedomElement(result, iGroupe, iElement) {

	if (iGroupe != -1) {
		listeJeedom += "<li>" + jsonJeedom.groupes[iGroupe].controles[iElement].nom + " : " + result + " " + jsonJeedom.groupes[iGroupe].controles[iElement].unite + "</li>";
	}

}

function sendMessage(msg) {
	// A tab has be selected for the message to be sent
	var params = {
		active: true,
		currentWindow: true
	}

	// recherche de l'onglet actif dans la fenêtre Chrome courante
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
			var nbGroupes = jsonJeedom.groupes.length;
			// Parcours des groupes
			for (var indGroupe=0;indGroupe<nbGroupes;indGroupe++) {
				addBefore(jsonJeedom.groupes[indGroupe].libelle);

				var nbElements= jsonJeedom.groupes[indGroupe].controles.length;
				// Parcours des elements du groupe
				for (var indElement=0;indElement<nbElements;indElement++) {
				    url = jeedomUrl + "/core/api/jeeApi.php?apikey=" + jeedomApiKey + "&type=cmd&id=" +
						jsonJeedom.groupes[indGroupe].controles[indElement].id;
						// Récupération de la valeur des champs Jeedom
						loadHTTPRequest(url, initJeedomElement, indGroupe, indElement);
				}

				addAfter();
			}

			document.getElementById('listeJeedom').innerHTML=listeJeedom;
		}
	}

	function executerRequete(callback) {
		// on vérifie si la liste des elements a déjà été chargée pour n'exécuter la requête AJAX qu'une seule fois
		// (A voir pour optimisation future : utilisation de sessionElements)
		if (localStorage.getItem('sessionElements') != null && localStorage.getItem('sessionElements') != "null") {
			jsonJeedom = JSON.parse(localStorage.getItem('sessionElements'));
			callback();
		}
		else {
			if (jsonJeedom.length === 0) {
				// on récupère un objet XMLHttpRequest
				var xhr = getXMLHttpRequest();
				// on réagit à l'événement onreadystatechange
				xhr.onreadystatechange = function() {
					// test du statut de retour de la requête AJAX
					if (xhr.readyState == 4 && (xhr.status == 200 || xhr.status == 0)) {
						// on désérialise les parametres et on le sauvegarde dans une variable
						jsonJeedom = JSON.parse(xhr.responseText);
						// on lance la fonction de callback avec les parametres récupérés
						callback();
					}
				}
				// la requête AJAX : lecture des parametres (depuis jeedom.json)
				xhr.open("GET", jeedomFile, true);
				xhr.send();
			} else {
				// On lance la fonction de callback avec les parametres déjà récupérés précédemment
				callback();
			}
		}
	}

	// Inutilisé actuellement (attente optimisations)
	function emptyElements() {
		localStorage.setItem('sessionElements', null);
		window.location = window.location;
	}

	// On initialise les données de l extension à partir du fichier /import/jeedom.json
	executerRequete(initialisationDonnees);

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

}, false);
