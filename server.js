//Variables que necesitaremos


var express = require('express');


var app = express();
app.use(express.static('public'));

var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

//Aqui guardaremos los usuarios
var usuarios = [];

//Guardamos las palabras que apareceran en el juego
var palabras = ["disfraz", "chatarra", "demoler", "instrucciones",
                "descubrimiento","alfombra","taza", "navidad",
                "oveja", "rata", "ballena", "perro", "gato",
                "avion", "tirar", "redondo", "bandera",
                "pavo", "turbulencia", "comer", "pelear",
                "escribir", "isla", "juventud", "enseñar",
                "niño", "hilo", "festejar", "mar", "armario",
                "militar", "extraterrestre", "juegos", "caballo",
                "ventilador", "aniversario", "disco", "estanque",
                "maleta", "lombriz", "rata", "estufa", "auto",
                "diamante", "radio", "tormenta", "medianoche",
                "moneda", "sombra", "relatar", "arrastrarse", "fama"];

//Creamos la funcion para generar una nueva palabra
function nuevaPalabra() {

    numpalabra = Math.floor(Math.random() * (palabras.length));
    return palabras[numpalabra];

};

var numpalabra;


//Funcion para conectarse al socket
io.sockets.on('connection', function (socket){

    io.emit('listausuarios', usuarios);

    //Funcion para unirse a la sala
    socket.on('join', function (name){

        socket.username = name;

        //Unimos al usuario a una sala
        socket.join(name);
        console.log(socket.username + " se unio a la partida. Id: " + socket.id);

        //Guardamos el nombre del usuario en el array usuarios
        usuarios.push(socket.username);

        //Creamos la condicion para el primer dibujante (primero en unirse)
        if (usuarios.length == 1 || typeof io.sockets.adapter.rooms['dibujante'] === 'undefined'){
            console.log(usuarios);
            socket.join('dibujante');
            //convertimos al usuario en dibujante
            io.in(socket.username).emit('dibujante', socket.username);
            console.log(socket.username + " es el dibujante");

            //Enviamos una palabra al azar al dibujante
            io.in(socket.username).emit('dibujar palabra', nuevaPalabra());

        }
        //Si hay alguien mas en la sala
        
        else{
            //si se unen mas personas seran concursantes
            socket.join('adivinador');
            console.log(usuarios);
            // Enviamos el evento para convertir en adivinador a este usuario
            io.in(socket.username).emit('adivinador', socket.username);
            console.log(socket.username + 'es un adivinador');

        }

        io.emit('listausuarios', usuarios);

    });

    //Mostramos el dibujo
    socket.on('dibujar', function(obj){

        socket.broadcast.emit('dibujar', obj);

    });

    //Mostramos las palabras que envian los usuarios
    socket.on('adivinarpalabra', function(data){

        io.emit('adivinarpalabra', {username: data.username, adivinarpalabra: data.adivinarpalabra});
        console.log(data.username + 'dice que es: ' + data.adivinarpalabra);


    });

    //Realizamos la funcion para cuando se desconecte el usuario
    socket.on('disconnect', function(){

        for(var i = 0; i < usuarios.length; i++){

            //Eliminamos al usuario de la lista
            if(usuarios[i] == socket.username){
                usuarios.splice(i, 1);
            };
        };
        console.log(socket.username + ' se ha desconectado');

        //Actualizamos la lista de usarios
        io.emit('listausuarios', usuarios);

        //Si el dibujante no tiene conexion o no existe
        if( typeof io.sockets.adapter.rooms['dibujante'] === "undefined"){

            //Generamos un numero al azar para escoger el nuevo dibujante
            var x = Math.floor(Math.random() * (usuarios.length));
            console.log(usuarios[x]);

            //Asignamos a un nuevo dibujante
            io.in(usuarios[x]).emit('nuevo dibujante', usuarios[x]);

        };

    });

    //Funcion para el nuevo dibujante
    socket.on('nuevo dibujante', function(name){

        socket.leave('adivinador');

        //Agregamos a un nuevo dibujante
        socket.join('dibujante');
        console.log('El nuevo dibujante es: ' + name);

        socket.emit('dibujante', name);

        //Enviamos la palabra a dibujar
        io.in('dibujante').emit('dibujar palabra', nuevaPalabra());

    });


    //Funcion para intercambio de roles
    socket.on('swap rooms', function(data){

        //El dibujante pasa a la sala de concursante
        socket.leave('dibujante');
        socket.join('adivinador');
        socket.emit('adivinador', socket.username);

        //Convertimos en dibujante a otro usuario
        io.in(data.to).emit('dibujante', data.to);

        //Generamos nueva palabra
        io.in(data.to).emit('dibujar palabra', nuevaPalabra());
        io.emit('reset', data.to);

    });

    //Funcion para respuesta correcta
    socket.on('respuesta correcta', function(data){

        io.emit('respuesta correcta', data);
        console.log(data.username + 'adivino la palabra ' + data.adivinar);

    });

    //Funcion para limpiar pantalla
    socket.on('limpiar pantalla', function(name){

        io.emit('limpiar pantalla', name);

    });

});


//Servidorrr

//server.maxConnections = 6;
server.listen(process.env.PORT || 8080, () => {

    console.log('Servidor escuchando en el puerto 8080');

});