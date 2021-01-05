var socket = io.connect('https://pinturillo-node.herokuapp.com/');
var usuario;

//Funcion para preguntar el username
function preguntarUsername(){

    $('.grey-out').fadeIn(500);
    $('.usuario').fadeIn(500);
    $('.usuario').submit(function(){
        event.preventDefault();
        usuario = $('#username').val().trim();

        //Si el usuario esta vacio
        if (usuario == '') {
            return false
        };

        var index = usuarios.indexOf(usuario);

        if (index > -1) {
            alert(usuario + ' ya existe');
            return false
        };
        
        //Unimos al usuario
        socket.emit('join', usuario);
        $('.grey-out').fadeOut(300);
        $('.usuario').fadeOut(300);
        $('input.adivinar-input').focus();
    });

};

var context;
var canvas;
var click = false;

var limpiarPantalla = function(){

    //Limpiamos la pantalla dandole los valores x y
    context.clearRect(0, 0, canvas[0].width, canvas[0].height);

};


//Decimos a que es igual el concursante
var adivinador = function(){

    limpiarPantalla();
    click = false;
    console.log('Estatus del dibujo ' + click);
    $('.dibujar').hide();
    $('#adivinadores').empty();
    console.log('Eres adivinador');
    $('#adivinar').show();
    $('.adivinar-input').focus();

    //Mosramos la palabra a adivinar
    $('#adivinar').on('submit', function() {
        event.preventDefault();
        var adivinar = $('.adivinar-input').val();

        if (adivinar == '') {
            return false
        };

        console.log(usuario + " dijo que es: " + adivinar);
        socket.emit('adivinarpalabra', {username: usuario, adivinarpalabra: adivinar});
        $('.adivinar-input').val('');
    });

};

var adivinarpalabra = function(data){

    $('#adivinadores').append('<li>' +data.username + " dijo que es: " + data.adivinarpalabra+ '</li>').scrollTop($("#adivinadores").height());

    if (click == true && data.adivinarpalabra == $('span.word').text() ) {
        console.log('adivinador: ' + data.username + ' draw-word: ' + $('span.word').text());
        socket.emit('respuesta correcta', {username: data.username, adivinarpalabra: data.adivinarpalabra});
        socket.emit('swap rooms', {from: usuario, to: data.username});
        click = false;
    }

};

var dibujarPalabra = function(word){

    $('span.word').text(word);
    console.log('Tienes que dibujar: ' + word);

};

var usuarios = [];

var listausuarios = function(names){

    usuarios = names;

    //Insertamos codigo html
    var html = '<p class="chatbox-header">' + 'Jugadores' + '</p>';
    
    //Mostramos la Lista de usuarios en el html
    for (var i = 0; i < names.length; i++) {
        html += '<li>' + names[i] + '</li>';
    };
    $('ul').html(html);

};

//Creamos un nuevo dibujante
var nuevoDibujante = function(){
    
    socket.emit('nuevo dibujante', usuario);
    limpiarPantalla();
    $('#adivinadores').empty();

};

var respuestaCorrecta = function(data){
    //Mostramos un mensaje en html
    $('#adivinadores').html('<p>' + data.username + ' adivino la palabra!' + '</p>');
};

var reset = function(name) {
    limpiarPantalla();
    $('#adivinadores').empty();
    console.log('Nuevo dibujante: ' + name);
    //Mostramos quien es el nuevo dibujante
    $('#adivinadores').html('<p>' + name + ' es el nuevo Dibujante' + '</p>');
};

var dibujar = function(obj){

    //Obtenemos el color con el que dibuje
    context.fillStyle = obj.color;
    context.beginPath();
    context.arc(obj.position.x, obj.position.y,
         3, 0, 2 * Math.PI);
    
    context.fill();

};

var pictionary = function(){

    limpiarPantalla();
    click = true;
    console.log('Estatus del dibujo: ' + click);
    $('#adivinar').hide();
    $('#adivinadores').empty();
    $('.dibujar').show();

    var dibujando;
    var color;
    var obj = {};

    $('.draw-buttons').on('click', 'button', function(){
        obj.color = $(this).attr('value');
        console.log(obj.color);

        if (obj.color === '0') {
            socket.emit('limpiar pantalla', usuario);
            //El color por defecto sera el blanco
            context.fillStyle = 'white';
            return;
        };
    });

    console.log('Eres el dibujante');

    $('.usuarios').on('dblclick', 'li', function() {
        //Si dan doble click intercambiamos los roles
        if (click == true) {
            var target = $(this).text();
            socket.emit('swap rooms', {from: usuario, to: target});
        };
    });

    //--------------------Eventos de movimiento del mouse-------------------

    //Movimiento hacia abajo
    canvas.on('mousedown', function(event) { 
        dibujando = true;   
    });

    //Movimiento hacia arriba
    canvas.on('mouseup', function(event) {
        dibujando = false;
    });

    //Movimiento del mouse
    canvas.on('mousemove', function(event) {
        var offset = canvas.offset();

        //Posicion del dibujo
        obj.position = {x: event.pageX - offset.left,
                        y: event.pageY - offset.top};
        
        if (dibujando == true && click == true) {
            dibujar(obj);
            socket.emit('dibujar', obj);
        };
    });

};


//Parametros a usar en el juego
$(document).ready(function() {

    canvas = $('#canvas');
    context = canvas[0].getContext('2d');
    canvas[0].width = canvas[0].offsetWidth;
    canvas[0].height = canvas[0].offsetHeight;

    preguntarUsername();

    socket.on('listausuarios', listausuarios);
    socket.on('adivinador', adivinador);
    socket.on('adivinarpalabra', adivinarpalabra);
    socket.on('dibujar', dibujar);
    socket.on('dibujar palabra', dibujarPalabra);
    socket.on('dibujante', pictionary);
    socket.on('nuevo dibujante', nuevoDibujante);
    socket.on('respuesta correcta', respuestaCorrecta);
    socket.on('reset', reset);
    socket.on('limpiar pantalla', limpiarPantalla);

});

