// types autorises à être affichés dans l'extension
// liste des types pouvant être sélectionnés (les types non présents sont affichés en grisé)
var typesAutorises = ['info','action'];//,'action'

// Gestion des options de notification
// Initialisation au premier lancement de l'extension
if (Config.get("retourParNotification") === null) {
  Config.set("retourParNotification", "true");
}

// Sélection de la checkbox pour le retour par notification
$( "input[type=checkbox]" ).click(function() {
  Config.set("retourParNotification", $('#retourParNotificationCheckbox').is(':checked'));
});

// Panel clickable
$(document).on('click', '.panel-heading span.clickable', function(e){
  var $this = $(this);
	if (!$this.hasClass('panel-collapsed')) {
		$this.parents('.panel').find('.panel-body').slideUp();
		$this.addClass('panel-collapsed');
		$this.find('i').removeClass('glyphicon-chevron-up').addClass('glyphicon-chevron-down');
	}
  else {
		$this.parents('.panel').find('.panel-body').slideDown();
		$this.removeClass('panel-collapsed');
		$this.find('i').removeClass('glyphicon-chevron-down').addClass('glyphicon-chevron-up');
	}
})

var xhttp = null;
function loadHTTPRequest(url, cfunc, ind) {

  // Annulation de la requête précédente si en cours
  if (xhttp && xhttp.readyState != 0) {
  	xhttp.abort();
  }

  xhttp = new XMLHttpRequest();

  console.log('enter loadHTTPRequest : ' + ind);
  xhttp.onreadystatechange = function() {

  	console.log('xhttp.readyState=' + xhttp.readyState);
    if (xhttp.readyState === XMLHttpRequest.DONE) {

  		// traitement de la reponse
  		if (xhttp.status == 200 || xhttp.status == 401) {
  			// affichage du resultat de la commande Jeedom
  			cfunc(xhttp.responseText, 0);
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

// Arbre de données Jeedom
function initialisationDonneesJeedom(result, status) {
  if (status != -1) { // -1 : en cours de récupération

      jsonJeedomElements = JSON.parse(result);
      // creation des pieces
      jsonJeedomElements.forEach(function(piece){
        if (piece.father_id == null) {
          topName = piece.name;
          topId = piece.id;
        }
      });

      // Parcours des pièces
      jsonJeedomElements.forEach(function(piece){
        console.log('- parcours pièce ' + piece.name);
        // Parcours des éléments de chaque pièce
        piece.eqLogics.forEach(function(elt){
          console.log('-- parcours élément ' + elt.name)
          elt.cmds.forEach(function(cmd){
            //if (typesAutorises.indexOf(cmd.type) != -1) { // à remettre pour ne pas afficher les types non autorisés
              console.log('--- ajout commande ' + cmd.name + '(' + cmd.type + ')')
              $("#jeedomSelection").append($('<option></option>')
                .attr("value", cmd.type+'/'+piece.name+'/'+elt.name+'/'+cmd.name+'/'+cmd.id+'/'+cmd.unite).attr("data-section",piece.name + '/' + elt.name).attr('data-index','top')
                .attr('selected',(Config.get('jeedomElements') != null && Config.get('jeedomElements').indexOf('/'+cmd.id+'/') != -1)?'selected':null)
                .attr('readonly', (typesAutorises.indexOf(cmd.type) == -1)?'readonly':null)
                .attr('data-description', cmd.type)
                .text(cmd.name));
            //}
          });
        });
      });

      // Options de l'arbre Jeedom
      $("#jeedomSelection").treeMultiselect({
        startCollapsed: true,
        collapsible: true,
        allowBatchSelection: true,
        enableSelectAll: true,
        selectAllText: 'Sélectionner tout',
        unselectAllText: 'Désélectionner tout',
        sectionDelimiter: '/',
        showSectionOnSelected: true,
        searchable: true,
        // Paramètres de recherche (valeurs possibles : 'value', 'text', 'description', 'section')
        searchParams: ['value', 'text', 'section'],
        // Callback
        onChange: null
      });

  }
}

// Récupération de tous les éléments de Jeedom
function recuperationDonneesJeedom(callback) {
  jeedomUrl = Config.get("jeedomUrl");
  jeedomApiKey = Config.get("jeedomApiKey");
  if (jeedomUrl !== null && jeedomApiKey !== null) {
    // Chargement de l url Jeedom et la cle API Jeedom
    url = jeedomUrl + "/core/api/jeeApi.php?apikey=" + jeedomApiKey + "&type=fullData";

    // Récupération de la valeur des champs Jeedom
    loadHTTPRequest(url, callback,0);
  }
}

// Actions sur fin de chargement de la page des options
$(document).ready(function(){
  $(window).scroll(function () {
    if ($(this).scrollTop() > 50) {
        $('#back-to-top').fadeIn();
    } else {
        $('#back-to-top').fadeOut();
    }
  });
  // scroll body to 0px on click
  $('#back-to-top').click(function () {
    $('#back-to-top').tooltip('hide');
    $('body,html').animate({
        scrollTop: 0
    }, 800);
    return false;
  });

  //$('#back-to-top').tooltip('show');

  // Lecture des données de Jeedom
  recuperationDonneesJeedom (initialisationDonneesJeedom);
});

// Liste des objets de la page des Options
var Options = function(){

  this.buttons = {
    save_options : document.getElementById('save_options'),
    save_elements : document.getElementById('save_elements'),
  };

  this.checkboxes = {
    retourParNotificationCb : document.getElementById("retourParNotificationCheckbox"),
  }

  this.outputs = {
    status_import : document.getElementById("status_import"),
  };

  this.init = function(){

    this.init_listeners();
    this.init_rules();
  }

  this.init_listeners = function(){
    this.buttons.save_options.addEventListener(
      'click', this.save_options.bind(this, null));
    this.buttons.save_elements.addEventListener(
      'click', this.save_elements.bind(this, null));
  }

  this.save_options = function(){
    console.log("enregistrement des options");
    Config.set("jeedomUrl", document.getElementById('jeedomUrl').value);
    Config.set("jeedomApiKey", document.getElementById('jeedomApiKey').value);
    // rechargement de la page des options pour charger l'arbre Jeedom
	  window.location.reload();
}

  this.save_elements = function(){
    console.log("enregistrement des éléments Jeedom sélectionnés");
    Config.set("jeedomElements", $('#jeedomSelection').val());
  }

  this.update_status_import = function(value) {
    this.outputs.status_import.innerHTML = value;
    setTimeout(this.clear_status_import.bind(this), 1000);
  }

  this.clear_status_import = function() {
    this.outputs.status_import.innerHTML = "";
  }

  this.init_rules = function(){

    this.checkboxes.retourParNotificationCb.checked = (Config.get("retourParNotification") === "true");

    // Affichage d une popup pour demande de remplir l url Jeedom et l API Key Jeedom
    if (Config.get("jeedomUrl") === null || Config.get("jeedomApiKey") === null) {
      // on previent l utilisateur qu il n a pas renseigne les champs necessaires a l utilisation de l extension
      $('#confirmationImportModal').modal('show');
    }
    else {
      // Chargement de l url Jeedom et la cle API Jeedom
      document.getElementById('jeedomUrl').value = Config.get("jeedomUrl");
      document.getElementById('jeedomApiKey').value = Config.get("jeedomApiKey");
    }
  }

  // Initialisation au chargement de la page des Options
  this.init();
}
document.addEventListener('DOMContentLoaded', function(){
  var opt = new Options();

  // Gestion des touches de raccourcis
  Mousetrap.bind(['command+s', 'ctrl+s'], function(e) {
      opt.save_options();
      return false;
  });
  Mousetrap.bind(['command+e', 'ctrl+e'], function(e) {
      opt.save_elements();
      return false;
  });
});
