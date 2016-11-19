var plugin = function(options) {
    var seneca = this;
    
    seneca.add({area: "patient", action: "fetch"}, function(args, done) {
        console.log("-->fetch");
        var patients = this.make("patients");
        patients.list$({}, done);
    });

    seneca.add({area: "patient", action: "fetchbyid"}, function(args, done) {
        console.log("-->fetchbyid, patient_id:"+ args.patient_id );
        var patients = this.make("patients");
        patients.list$({id:args.patient_id}, done);
    });
	
   seneca.add({area: "patient", action: "add"}, function(args, done) {
        console.log("-->add, patient_name:"+ args.patient_name );
        
        var patients = this.make("patients");
        
        patients.patient_name = args.patient_name;
        patients.doc_id = args.doc_id;
        patients.nurse_id = args.nurse_id;
        patients.room_no = args.room_no;
        patients.username = args.username;
        patients.password = args.password;

        patients.save$(function(err, patient) {
            done(err, patients.data$(false));
        });
    });

    seneca.add({area: "patient", action: "delete"}, function(args, done) {
        console.log("-->delete, patient_id:"+ args.patient_id );
        var patient = this.make("patients");
        patient.remove$(args.patient_id, function(err) {
            done(err, null);
        });
    });


    seneca.add({ area: "patient", action: "edit" }, function (args, done) {
        console.log("-->edit, patient_id:" + args.patient_id);
        var patients = this.make("patients");
        patients.list$({ id: args.patient_id }, function (err, result) {
             console.log("-->-->: patients.list$ id:" + args.patient_id);
                console.log("-->-->: patients.data$");
                console.log("-->-->: result[0]: " + result[0].item_name);
                // TODO: if not found, return error
                var patient = result[0]; // first element
                patient.data$(
                    {
                        patient_name : args.patient_name,
                        doc_id : args.doc_id,
                        nurse_id : args.nurse_id,
                        room_no : args.room_no,
                        username : args.username,
                        password : args.password
                    }
                );
                console.log("-->-->: patients.save$");                
                patient.save$(function (err, result) {
                    console.log("-->-->-->: patient.data$, patient:"+ patient);
                    done(err, result.data$(false));
                });
            }


        );
    });
    
}
module.exports = plugin;



var seneca = require("seneca")();
seneca.use(plugin);
seneca.use('seneca-entity');
seneca.use("mongo-store", {
    name: "seneca",
    host: "127.0.0.1",
    port: "27017"
});

seneca.ready(function(err){
    console.log("db connected");
    seneca.act('role:web',{use:{
      prefix: '/patients',
      pin: {area:'patient',action:'*'},
      map:{
        fetch: {GET:true},
        fetchbyid: {GET:true, suffix: '/:patient_id'},
        add: {GET:false,POST:true},
        delete: {DELETE:true, suffix: '/:patient_id'},
        edit: {PUT:true, suffix: '/:patient_id'}
      }
    }});

    var express = require('express');
    var app = express();

    app.use( require("body-parser").json() )
    
    // This is how you integrate Seneca with Express
    app.use( seneca.export('web') );

    app.listen(3000);
    console.log("Server listening on: //localhost:"+3000);
    console.log("--- Actions -----------");
    console.log("http://localhost:3000/patients/fetch");
    console.log("http://localhost:3000/patients/fetchbyid/123");
    console.log("http://localhost:3000/patients/add");
    console.log("http://localhost:3000/patients/delete");
    console.log("http://localhost:3000/patients/edit/123");
	
	var SERVICE_NAME  ="patient-manager";
    var PORT = 3000;
	
	seneca.listen({port: PORT});
	console.log(SERVICE_NAME + " started... listening @ http://127.0.0.1:"+ PORT +"/act")
	console.log('commands: {"area": "patient", "action":"fetch"}')

});
