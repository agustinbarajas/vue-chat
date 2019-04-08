<template>
  <v-app>
    <v-toolbar app color="primary" dark>
      <v-toolbar-title class="headline title">Chat</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-layout v-if="usuario" align-center justify-end>
        <span class="mr-3 username">{{usuario.nombre}}</span>
        <v-avatar color="white" size="40">
          <v-img :src="usuario.foto"></v-img>
        </v-avatar>
      </v-layout>
    </v-toolbar>

    <v-content>
      <v-container class="fondo" fluid fill-height>
        <login v-if="!usuario" @onNotificacion="notificar" @onIngresar="ingresar"/>
        <chat v-if="usuario" @onNotificacion="notificar" :usuario="usuario"/>
      </v-container>
    </v-content>

    <v-snackbar
      v-model="notificacion.visible"
      :color="notificacion.color"
      :multi-line="true"
      :rigth="true"
      :top="true"
      :bottom="false"
      :left="false"
      :timeout="6000"
      dark
    >
      <span>{{notificacion.mensaje}}</span>
      <v-btn color="white" flat @click="notificacion.visible = false">Cerrar</v-btn>
    </v-snackbar>

    <v-footer color="primary" dark>
      <v-layout justify-left>
        <span class="ml-5 font-15">Chat 2019</span>
      </v-layout>
      <v-layout justify-end>
        <span
          class="mr-5 font-15 cursor-pointer"
          flat
          small
          @click="usuario=null"
          v-if="usuario"
        >Cerrar sesión</span>
      </v-layout>
    </v-footer>
  </v-app>
</template>

<script>
import Login from "./components/Login";
import Chat from "./components/Chat";

export default {
  name: "App",
  components: {
    Login,
    Chat
  },
  data() {
    return {
      usuario: null,
      notificacion: {
        mensaje: "",
        color: "",
        visible: false
      }
    };
  },
  methods: {
    ingresar(usuario) {
      this.usuario = usuario;
    },
    notificar(notificacion) {
      this.notificacion.mensaje = notificacion.mensaje;
      this.notificacion.color = notificacion.color;
      this.notificacion.visible = true;
    }
  }
};
</script>

<style>
@import url("https://fonts.googleapis.com/css?family=Germania+One|Roboto+Slab");
.title {
  text-transform: uppercase;
  font-family: "Germania One", cursive !important;
}
.username {
  font-size: 18px;
  font-family: "Germania One", cursive !important;
}
.font-15 {
  font-size: 15px;
  font-family: "Germania One", cursive !important;
}
.cursor-pointer {
  cursor: pointer;
}
.fondo {
  background-color: #f1f1f120;
}
</style>
