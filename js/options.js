// Gestion des options de notification
// Initialisation au premier lancement de l'extension
if (Config.get("retourParNotification") === null) {
  Config.set("retourParNotification", "true");
}

// Selection de la checkbox pour le retour par notification
$("#retourParNotificationCheckbox").on('switchChange.bootstrapSwitch', function(event, state) {
  Config.set("retourParNotification", state);
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

// back to top
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

});

var Options = function(){

  this.buttons = {
    save_options : document.getElementById('save_options'),
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
  }

  this.save_options = function(){
    console.log("enregistrement des options");
    Config.set("jeedomUrl", document.getElementById('jeedomUrl').value);
    Config.set("jeedomApiKey", document.getElementById('jeedomApiKey').value);
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
      //Config.set("jeedomUrl", document.getElementById('jeedomUrl').value);
      //Config.set("jeedomApiKey", document.getElementById('jeedomApiKey').value);
      opt.save_options();
      return false;
  });
});
