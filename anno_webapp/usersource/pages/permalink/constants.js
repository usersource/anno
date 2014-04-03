var AnnoConstantsModule = angular.module('AnnoConstantsModule', []);
AnnoConstantsModule.value("AnnoConstants", {
    level1Color:"#ff9900",
    level1ColorRGB:"255, 153, 0",
    level2Color:"#ff0000",
    level2ColorRGB:"255, 0, 0",
    API: {
        config: {
            "1": {
                "serverId":"Production",
                "serverName":"Production",
                "imageServiceURL":"http://annoserver.appspot.com/screenshot",
                "apiRoot":"https://annoserver.appspot.com/_ah/api",
                "clientId" : "22913132792.apps.googleusercontent.com",
                "clientSecret": "LBlzLWXDgGXyvjlT-5gUjZGA",
                "proxyKey":"3"
            },
            "2": {
                "serverId":"Test",
                "serverName":"Test",
                "imageServiceURL":"http://annoserver-test.appspot.com/screenshot",
                "apiRoot":"https://annoserver-test.appspot.com/_ah/api",
                "clientId" : "394023691674-7j5afcjlibblt47qehnsh3d4o931orek.apps.googleusercontent.com",
                "clientSecret": "n0fJeoZ-4UFWZaIG41mNg41_",
                "proxyKey":"4"
            },
            "3": {
                "serverId":"ProductionViaEC2",
                "serverName":"Production via EC2 proxy",
                "imageServiceURL":"http://178.18.16.111:80/screenshot",
                "apiRoot":"http://178.18.16.111:80/_ah/api",
                "clientId" : "22913132792.apps.googleusercontent.com",
                "clientSecret": "LBlzLWXDgGXyvjlT-5gUjZGA"
            },
            "4": {
                "serverId":"TestViaEC2",
                "serverName":"Test via EC2 proxy",
                "imageServiceURL":"http://178.18.16.111:81/screenshot",
                "apiRoot":"http://178.18.16.111:81/_ah/api",
                "clientId" : "394023691674-7j5afcjlibblt47qehnsh3d4o931orek.apps.googleusercontent.com",
                "clientSecret": "n0fJeoZ-4UFWZaIG41mNg41_"
            },
            "5": {
                "serverId":"Dev",
                "serverName":"Dev",
                "imageServiceURL":"http://usersource-anno.appspot.com/screenshot",
                "apiRoot":"https://usersource-anno.appspot.com/_ah/api",
                "clientId" : "955803277195.apps.googleusercontent.com",
                "clientSecret": "l5UwDYJuv2BdUUBF2tu9fsol",
                "proxyKey":"6"
            },
            "6": {
                "serverId":"DevViaEC2",
                "serverName":"Dev via EC2 proxy",
                "imageServiceURL":"http://178.18.16.111:82/screenshot",
                "apiRoot":"http://178.18.16.111:82/_ah/api",
                "clientId" : "955803277195.apps.googleusercontent.com",
                "clientSecret": "l5UwDYJuv2BdUUBF2tu9fsol"
            }
        },
        serverURLKey: "3",
        apiVersion: "1.0",
        anno: "anno",
        user: "user",
        account: "account",
        followUp: "followup",
        vote: "vote",
        flag: "flag"
    }
});