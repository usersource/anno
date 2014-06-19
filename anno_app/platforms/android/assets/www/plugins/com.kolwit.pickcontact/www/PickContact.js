cordova.define("com.kolwit.pickcontact.PickContact", function(require, exports, module) { /**
 * @constructor
 */
var PickContact = function(){};


PickContact.prototype.chooseContact = function(success, failure){
    cordova.exec(success, failure, "PickContact", "chooseContact", []);
};

// Plug in to Cordova
cordova.addConstructor(function() {

    if (!window.Cordova) {
        window.Cordova = cordova;
    };


    if(!window.plugins) window.plugins = {};
    window.plugins.PickContact = new PickContact();
});

});
