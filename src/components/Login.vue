<template>
  <v-layout justify-center align-center>
    <v-flex xs12 sm8 md6 lg5 xl4>
      <v-card>
        <v-toolbar color="primary" dark card>
          <v-toolbar-title>Iniciar sesión</v-toolbar-title>
        </v-toolbar>
        <v-card-text>
          <v-text-field v-model="email" label="Correo" autofocus></v-text-field>
          <v-text-field
            @keyup.enter="ingresar"
            v-model="password"
            label="Contraseña"
            type="password"
          ></v-text-field>
        </v-card-text>
        <v-card-text>
          <v-layout justify-end>
            <v-btn @click="ingresar" color="primary">Entrar</v-btn>
          </v-layout>
        </v-card-text>
      </v-card>
    </v-flex>
  </v-layout>
</template>

<script>
import { auth, db } from "../firebase";

export default {
  data() {
    return {
      email: "",
      password: ""
    };
  },
  methods: {
    async ingresar() {
      if (!this.email) {
        this.enviarNotificacion("El correo es un campo obligatorio", "warning");
        return;
      }
      if (!this.password) {
        this.enviarNotificacion(
          "La contraseña es un campo obligatorio",
          "warning"
        );
        return;
      }
      await auth
        .signInWithEmailAndPassword(this.email, this.password)
        .then(() => {
          this.getDataUser(auth.currentUser);
        })
        .catch(error => {
          switch (error.code) {
            case "auth/user-not-found":
              this.enviarNotificacion("Usuario no encontrado", "error");
              break;
            case "auth/wrong-password":
              this.enviarNotificacion("Contraseña errónea", "error");
              break;
            default:
              this.enviarNotificacion("Error al ingresar", "error");
          }
        });
    },
    async getDataUser(currentUser) {
      if (currentUser) {
        let uid = currentUser.uid;
        let doc = await db
          .collection("usuarios")
          .doc(uid)
          .get()
          .then(doc => {
            if (doc.exists) {
              let usuario = doc.data();
              this.$emit("onIngresar", usuario);
            } else {
              this.enviarNotificacion(
                "No se encontraron datos del usuario",
                "error"
              );
            }
          });
      }
    },
    enviarNotificacion(mensaje, color) {
      this.$emit("onNotificacion", { mensaje, color });
    }
  }
};
</script>
