const { Usuarios } = require('../classes/usuarios');

const usuarios = new Usuarios();

const { io } = require('../server');

const { crearMensaje } = require('../utils/utilidades');


io.on('connection', (client) => {

    client.on('entrarChat', (data, callback) => {

        console.log(data);
        if (!data.nombre || !data.sala) {
            return callback({
                error: true,
                mensaje: 'el nombre y la sala son necesarios'
            });
        }

        // Unirse a una sala
        client.join(data.sala);

        usuarios.agregarPersona(client.id, data.nombre, data.sala);

        client.broadcast.to(data.sala).emit('listaPersona', usuarios.getPersonasPorSala(data.sala));

        callback(usuarios.getPersonasPorSala(data.sala));
    })

    client.on('crearMensaje', (data) => {

        let persona = usuarios.getPersona(client.id);
        let mensaje = crearMensaje(persona.nombre, data.mensaje);
        client.broadcast.to(persona.sala).emit('crearMensaje', mensaje);
    })

    client.on('disconnect', () => {
        let personaBorrada = usuarios.borrarPersona(client.id);

        client.broadcast.to(personaBorrada.sala).emit('crearMensaje', crearMensaje('Administrador', `${personaBorrada.nombre} abandonó el chat`));
        client.broadcast.to(personaBorrada.sala).emit('listaPersona', usuarios.getPersonasPorSala(personaBorrada.sala));

    })

    // Mensajes privados
    client.on('mensajePrivado', data => {

        // validar que en data venga el mensaje a transmitir
        // data también debe contener el id de la persona a la que se quiere enviar el mensaje
        // if (!data.id) {
        //     return {
        //         ok: false,
        //         mensaje: 'No se encuentra el id del destino'
        //     };
        // }
        // if (personas.filter(persona => persona.id !== data.id) === null) {
        //     return {
        //         ok: false,
        //         mensaje: `El id ${data.id} no es de un cliente válido`
        //     }
        // }
        // if (!data.mensaje) {
        //     throw new Error('No hay mensaje válido');
        // }

        let persona = usuarios.getPersona(client.id);
        client.broadcast.to(data.para).emit('mensajePrivado', crearMensaje(persona.nombre, data.mensaje));

    })

});