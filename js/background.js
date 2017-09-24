
// Gestion de l'omnibox
chrome.omnibox.onInputChanged.addListener(
  function(texte, suggest) {
    console.log('inputChanged: ' + texte);
    suggest([
			{content: texte + " int", description: "'j int allume la tele' : Lance l'interaction 'Allume la tele'"},
      {content: texte + " sce", description: "'j sce 52' : Lance le scénario d'id 52"},
			{content: texte + " cmd", description: "'j cmd 71' : Lance la commande d'id 71"},
			{content: texte + " info", description: "'j info 57' : Affiche la valeur de l'info d'id 57"},
			{content: texte + " ifttt", description: "'j ifttt 43' : Lance la commande ifttt d'id 43"}
    ]);
});

// Gestion des commandes
var commandes = null;
chrome.omnibox.onInputEntered.addListener(
	function(texte) {
		console.log("omnibox :: 's " + texte + "''");
		commandes = texte.toLowerCase().split(' ');

		//console.log("connecting..");
		//var monPort = chrome.extension.connect({name: "Sample Communication 2"});

		/*
		if (monPort != null) {
			console.log ("envoi du message vers popup : " + texte);
			monPort.postMessage("Message vers popup.js : " + texte);
		}
		*/

		var param = "";
		var value = "";

    switch (commandes[0]) {
			case 'int' : // lance une interaction Jeedom
				param = texte.substring(commandes[0].length+1, texte.length);
				console.log("lancement interaction : " + param);
				var msg = {
					from : 'popup_interaction',
					param : param
				}
				affichagePage(msg);
				break;
			case 'sce' : // lance un scenario Jeedom
          param = commandes[1];
					console.log("lancement scenario : " + param);
					var msg = {
						from : 'popup_scenario',
						param : param
					}
					affichagePage(msg);
					break;
			case 'cmd' : // lance une commande
					param = commandes[1];
					console.log("appel commande : " + param);
					var msg = {
						from : 'popup_commande',
						param : param
					}
					affichagePage(msg);
					break;
      case 'info' : // Affiche une info
					param = commandes[1];
					console.log("appel info : " + param);
					var msg = {
						from : 'popup_info',
						param : param
					}
					affichagePage(msg);
					break;
			case 'ifttt' : // lance une action ifttt
          // gestion de seulement un parametre value : TODO : gerer le nombre de parametres saisis
					param = commandes[1];
          value = commandes[2];
					console.log("appel IFTTT : " + param);
					var msg = {
						from : 'popup_ifttt',
						param : param,
            value : value
					}
					affichagePage(msg);
					break;
		}
});

var portPopup = null;
chrome.extension.onConnect.addListener(function(port) {
  console.log("Connecte...");
  portPopup = port;
	port.onMessage.addListener(function(request) {
    if (request.from == 'popup_url') {
			// Affichage d'une url
			console.log('Lancement url');
			affichagePage(request);
		}
		else if (request.from == 'popup_notification') {
			// Affichage d'une notification
			console.log('affichage d une notification');
			createNotification(request.titre, request.contenu);
		}

		// envoi d'un message a popup.js (inutilisé actuellement)
		//port.postMessage("Message vers popup.js");
  });
});

// Affichage de l'url demandee / lancement de la requete demandee
function affichagePage(request) {
	// Parcours des fenetres/onglets ouverts
	var ongletDejaExistant = false;
	var windowsId = -1;
	var tabId = -1;
	var monUrl = "";
	var requestUrl = "";

	// Recuperation de la requete reclamee
	var param = request.param;
	// Recuperation du parametre optionnel (voir si nécessaire une liste de parametres)
	var value = request.value;

  if (request.from == 'popup_interaction') {
		if (param == null || param === "") {
      createNotification('Jeedom', 'Veuillez saisir une interaction');
		}
		else {
      requestUrl = Config.get("jeedomUrl") + '/core/api/jeeApi.php?apikey=' + Config.get("jeedomApiKey") + '&type=interact&query=' + encodeURI(request.param) + '&utf8=1';
      //createNotification('Jeedom', 'Lancement de l\'interaction "' + encodeURI(request.param) + '"');
			//monPort.postMessage("Message vers popup.js : " + request.param);
		}
	}
	else if (request.from == 'popup_scenario') {
		if (param == null || param === "") {
			createNotification('Jeedom', 'Veuillez saisir un id de scenario');
		}
		else if (param.search("[^0-9]")!=-1) {
			createNotification('Jeedom', 'Veuillez saisir un id de scenario correct');
		}
		else {
			requestUrl = Config.get("jeedomUrl") + '/core/api/jeeApi.php?apikey=' + Config.get("jeedomApiKey") + '&type=scenario&id=' + param + '&action=start';
			//createNotification('Jeedom', 'Lancement du scenario  ' + request.param);
		}
	}
	else if (request.from == 'popup_info') {
		if (param == null || param === "") {
			createNotification('Jeedom', 'Veuillez saisir un id info');
		}
		else if (param.search("[^0-9]")!=-1) {
			createNotification('Jeedom', 'Veuillez saisir un id info correct');
		}
		else {
			requestUrl = Config.get("jeedomUrl") + '/core/api/jeeApi.php?apikey=' + Config.get("jeedomApiKey") + '&type=info&id=' + param + '&value=1';
			//createNotification('Jeedom', 'Lancement de la commande ' + request.param);
		}
	}
	else if (request.from == 'popup_commande') {
		if (param == null || param === "") {
			createNotification('Jeedom', 'Veuillez saisir un id de commande');
		}
		else if (param.search("[^0-9]")!=-1) {
			createNotification('Jeedom', 'Veuillez saisir un id de commande correct');
		}
		else {
			requestUrl = Config.get("jeedomUrl") + '/core/api/jeeApi.php?apikey=' + Config.get("jeedomApiKey") + '&type=cmd&id=' + param;
			//createNotification('Jeedom', 'Lancement du scenario  ' + request.param);
		}
	}
	else if (request.from == 'popup_ifttt') {
		if (param === "") {
			createNotification('Jeedom', 'Veuillez saisir un id ifttt');
		}
		else if (param.search("[^0-9]")!=-1) {
			createNotification('Jeedom', 'Veuillez saisir un id ifttt correct');
		}
		else {
			requestUrl = Config.get("jeedomUrl") + '/core/api/jeeApi.php?apikey=' + Config.get("jeedomApiKey") + '&type=ifttt&id=' + param;
			if (value != null && value != "" && value != undefined)	{
				requestUrl += '&value=' + value
			}
			//createNotification('Jeedom', 'Lancement de la commande ' + request.param);
		}
	}
	else if (request.from == 'popup_url') {
		monUrl = request.urlDestination;
	}

	if (monUrl != "") {
		//chrome.tabs.query({},function(tabs){
		//	tabs.forEach(function(tab){
		console.log('parcours fenetres');
		chrome.windows.getAll({ populate: true }, function (windows) {
			console.log('lancement boucle');
			for (var i = 0; i < windows.length; ++i) {
				var w = windows[i];
				if (!ongletDejaExistant && windowsId == -1) {
					// sauvegarde id window de la premiere fenêtre pour la création de l'onglet si inexistant
					windowsId = w.id;
				}
				for (var j = 0; j < w.tabs.length; ++j) {
					var tab = w.tabs[j];

					if (!ongletDejaExistant && tab.url == monUrl) {
						console.log("onglet " + tab.url + " deja existant !");
						ongletDejaExistant = true;
						windowsId = w.id;
						tabId = tab.id;
					}
				}
			}

			if (!ongletDejaExistant) {
				// Création d'un nouvel onglet pour cette url
				console.log("ouverture nouvel onglet pour " + monUrl);
				chrome.windows.update(windowsId, { focused: true }, function (window) {
					chrome.tabs.create({url: monUrl}, function(tab) {
					});
				});
			}
			else {
				// Focus sur l'onglet deja ouvert pour cette url
				console.log("focus sur l'onglet déjà ouvert pour " + monUrl);
				chrome.windows.update(windowsId, { focused: true }, function (window) {
					var updateProperties = {"active": true};
					chrome.tabs.update(tabId, updateProperties, function(tab){
					});
				});
			}
		});
	}
	else if (requestUrl != '') {
		// execution de la requete demandee
    loadHTTPRequest(requestUrl, retourRequestUrl, request.from);
	}
}

// callback requete
function retourRequestUrl(ret, i) {
	if (i != -1 && ret != null) {
		 // affichage du retour dans popup
     createNotification('Jeedom', ret);
	}
}

// affichage de notification
function createNotification(titre, contenu){
  console.log('createNotifications : (' + titre + ','+contenu + ')');
  var retourParNotification = Config.get("retourParNotification");

  if (retourParNotification === "true") {
    var opt = {
  		type : "basic",
  		title : titre,
  		message : unescape(contenu),
  		iconUrl : "../images/jeedomNotif.png"
  	};

    chrome.notifications.create("notificationName", opt, function(){});
    // fermeture de la notification apres 5 secondes
    setTimeout(
  	  function(){
  		    chrome.notifications.clear("notificationName", function(){});
  		},
  		5000
  	);
  }
  else {
    // remontée de l'info par alerte (TODO : afficher une alerte bootstrap)
    alert(titre + " : " + contenu);
  }
}

// lancement de la page des options
function lanceOptions() {
	setTimeout(
		function(){
			chrome.windows.getAll({ populate: true }, function (windows) {
				var windowsId = windows[0].id;
				chrome.windows.update(windowsId, { focused: true }, function (window) {
					affichagePage(chrome.runtime.getURL('/html/options.html'), false);
				});
			});
		},
		100
	);
}

var xhttp = null;

// HTTP request
function loadHTTPRequest(url, cfunc, ind) {

	console.log("http request");
	// annulation de la requete en cours précédente si en cours
	if (xhttp && xhttp.readyState != 0) {
		xhttp.abort();
	}

	xhttp = new XMLHttpRequest();

	xhttp.onreadystatechange = function() {

		if (xhttp.readyState === XMLHttpRequest.DONE) {

			// traitement de la reponse
			if (xhttp.status == 200 || xhttp.status == 401) {
				// affichage du resultat de la commande Jeedom=
				//console.log("resultat de la commande Jeedom : " + xhttp.responseText + " pour l'indice " + ind);
        cfunc(xhttp.responseText, ind);
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

// gestion des raccourcis clavier
chrome.commands.onCommand.addListener(function(command){

  var jeedomUrl = Config.get("jeedomUrl");
  var jeedomApiKey = Config.get("jeedomApiKey");
  var urlDestination = "";
  if (jeedomUrl !== null && jeedomApiKey !== null) {
			if (command == 'jeedom') {
			     urlDestination = jeedomUrl;
      }
			else if (command == 'forum') {
        urlDestination = "https://www.jeedom.com/forum";
			}
			else if (command == 'documentation') {
        urlDestination = "https://jeedom.github.io/documentation/";
			}

			// Lancement de la page
			var msg = {
				from : 'popup_url',
				urlDestination : urlDestination
			}

			affichagePage(msg);
  }
  else {
    // Infos Jeedom non renseignées dans les options
		console.log("raccourci " + command + " : redirection vers la page des options pour la saisie de l'url Jeedom et la clé Jeedom");
		//createNotification('Jeedom', 'Pas d\'url Jeedom et/ou de clé Jeedom enregistrée !');
		setTimeout(
			function(){
				console.log('ouverture de la page des options');
				var msg = {
					from : 'popup_url',
					urlDestination : chrome.runtime.getURL('/html/options.html')
				}

				affichagePage(msg);
			},
			100
		);
  }
});
