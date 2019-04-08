<template>
  <v-layout v-resize="onResize">
    <v-flex xs12 sm4 lg2 v-if="mostrarListaUsuarios">
      <v-card>
        <v-toolbar color="secondary" card dark dense>
          <v-toolbar-title class="title">Contactos</v-toolbar-title>
        </v-toolbar>
      </v-card>
      <v-list two-line>
        <template v-for="usuario in usuarios">
          <v-list-tile
            :key="usuario.uid"
            :value="usuarioSeleccionado && usuarioSeleccionado.uid === usuario.uid"
            @click="seleccionarUsuario(usuario)"
            active-class="usuario-seleccionado"
          >
            <v-list-tile-avatar>
              <v-img :src="usuario.foto"></v-img>
            </v-list-tile-avatar>
            <v-list-tile-content>
              <v-list-tile-title v-html="usuario.nombre" class="username"></v-list-tile-title>
              <v-list-tile-sub-title v-html="usuario.ultimoMensaje"></v-list-tile-sub-title>
            </v-list-tile-content>
            <v-list-tile-action v-if="usuario.cantidadMensajes > 0">
              <v-badge color="primary" overlap>
                <span slot="badge">{{usuario.cantidadMensajes}}</span>
              </v-badge>
            </v-list-tile-action>
          </v-list-tile>
        </template>
      </v-list>
    </v-flex>
    <v-flex xs12 sm8 lg5 v-if="mostrarChat">
      <v-container fill-height class="pa-0 ma-0">
        <v-layout align-end>
          <v-flex>
            <v-card color="#fad41020" :class="mostrarListaUsuarios ? 'ml-3' : 'ml-0'">
              <v-toolbar color="accent" card dense dark>
                <v-toolbar-title>
                  <v-icon class="mr-3" @click="regresar" v-if="esMovil">arrow_back</v-icon>
                  <v-avatar color="white" size="32">
                    <v-img :src="usuarioSeleccionado.foto"></v-img>
                  </v-avatar>
                  <span class="ml-3 title">{{usuarioSeleccionado.nombre}}</span>
                </v-toolbar-title>
              </v-toolbar>
              <v-container ref="chatBox" class="pa-0 ma-0 scroll-y">
                <v-card-text :style="`max-height: ${height}px;`">
                  <v-flex
                    xs7
                    v-for="item in chat"
                    :offset-xs5="item.uid === usuario.uid"
                    class="my-3"
                    :key="item.uid"
                  >
                    <v-layout column>
                      <div
                        :class="item.uid !== usuario.id ? 'chat-fecha-izq' : 'chat-fecha-der'"
                      >{{convertirFecha(item.fechaEnvio)}}</div>
                      <v-card
                        elevation="1"
                        :class="item.uid !== usuario.uid ? 'chat-mensaje-izq' : 'chat-mensaje-der'"
                        :color="item.uid !== usuario.uid ? 'white' : '#FAD41030'"
                      >
                        <v-card-text>
                          <div>{{item.text}}</div>
                        </v-card-text>
                      </v-card>
                    </v-layout>
                  </v-flex>
                </v-card-text>
              </v-container>
              <v-card-text>
                <v-text-field
                  ref="chatMensaje"
                  solo
                  hide-details
                  placeholder="Escribe un mensaje..."
                  :loading="enviandoMensaje"
                  :disabled="enviandoMensaje"
                  @keyup.enter="enviarMensaje"
                  v-model="mensaje"
                ></v-text-field>
              </v-card-text>
            </v-card>
          </v-flex>
        </v-layout>
      </v-container>
    </v-flex>
  </v-layout>
</template>

<script>
import { db } from "../firebase";
export default {
  props: ["usuario"],
  data() {
    return {
      usuarios: [],
      usuarioSeleccionado: null,
      chat: [],
      mensaje: "",
      enviandoMensaje: false,
      cid: null,
      detenerChat: null,
      height: 0
    };
  },
  computed: {
    esMovil() {
      return this.$vuetify.breakpoint.width < 600;
    },
    mostrarListaUsuarios() {
      return (
        (this.usuarios && (this.esMovil && !this.usuarioSeleccionado)) ||
        (this.usuarios && !this.esMovil)
      );
    },
    mostrarChat() {
      return this.usuarios && this.usuarioSeleccionado;
    }
  },
  created() {
    this.consultarUsuarios();
  },
  methods: {
    async consultarUsuarios() {
      await db
        .collection("usuarios")
        .get()
        .then(docs => {
          docs.forEach(doc => {
            let usuario = doc.data();
            if (usuario.uid !== this.usuario.uid) {
              usuario.cantidadMensajes = 0;
              usuario.ultimoMensaje = "";
              this.usuarios.push(usuario);
            }
          });
          this.consultarChatSinLeer();
        })
        .catch(() => {
          this.enviarNotificacion("Error al obtener usuarios", "error");
        });
    },
    async consultarChatSinLeer() {
      await db
        .collection("usuarios")
        .doc(this.usuario.uid)
        .collection("chat-sin-leer")
        .orderBy("fechaEnvio")
        .onSnapshot(
          snapshot => {
            snapshot.docChanges().forEach(change => {
              let mensaje = change.doc.data();
              let usuario = this.usuarios.find(usr => usr.uid === mensaje.uid);
              if (usuario) {
                switch (change.type) {
                  case "added":
                    usuario.cantidadMensajes++;
                    usuario.ultimoMensaje = mensaje.text;
                    break;
                  case "removed":
                    usuario.cantidadMensajes--;
                    usuario.ultimoMensaje = "";
                    if (usuario.cantidadMensajes < 0) {
                      usuario.cantidadMensajes = 0;
                    }
                    break;
                }
              }
            });
          },
          () => {
            this.enviarNotificacion(
              "Ocurrió un error al recuperar mensajes sin leer",
              "error"
            );
          }
        );
    },
    enviarNotificacion(mensaje, tipo) {
      this.$emit("onNotificacion", { mensaje, tipo });
    },
    async seleccionarUsuario(usuario) {
      this.cid = this.generarChatId(this.usuario.uid, usuario.uid);
      await db
        .collection("contactos")
        .doc(this.cid)
        .get()
        .then(doc => {
          this.crearChat(doc, usuario);
        })
        .catch(() => {
          this.enviarNotificacion(
            "Ha ocurrido un error al establecer la conexión con el chat",
            "error"
          );
        });
    },
    async crearChat(doc, usuario) {
      if (!doc.exists) {
        await db
          .collection("contactos")
          .doc(this.cid)
          .set({ cid: this.cid });
      }
      this.usuarioSeleccionado = usuario;
      this.consultarChat();
    },
    regresar() {
      this.usuarioSeleccionado = null;
    },
    async enviarMensaje() {
      if (!this.mensaje || this.enviandoMensaje) return;
      this.enviandoMensaje = true;
      const id = db
        .collection("contactos")
        .doc(this.cid)
        .collection("chat")
        .doc().id;
      let mensajeEnviado = {
        text: this.mensaje,
        fechaEnvio: new Date(),
        uid: this.usuario.uid,
        id: id
      };
      let batch = db.batch();

      batch.set(
        db
          .collection("contactos")
          .doc(this.cid)
          .collection("chat")
          .doc(id),
        mensajeEnviado
      );
      batch.set(
        db
          .collection("usuarios")
          .doc(this.usuarioSeleccionado.uid)
          .collection("chat-sin-leer")
          .doc(id),
        mensajeEnviado
      );

      await batch
        .commit()
        .then(() => {
          this.mensaje = "";
        })
        .catch(() => {
          this.enviarNotificacion(
            "Ocurrió un error al enviar el mensaje, intentelo de nuevo",
            "error"
          );
        });
      this.enviandoMensaje = false;
      this.$nextTick(() => {
        this.$refs.chatMensaje.focus();
      });
    },
    generarChatId(uid1, uid2) {
      return uid1 < uid2 ? `${uid1}-${uid2}` : `${uid2}-${uid1}`;
    },
    async consultarChat() {
      this.chat = [];
      if (this.detenerChat) {
        this.detenerChat();
      }
      this.detenerChat = await db
        .collection("contactos")
        .doc(this.cid)
        .collection("chat")
        .orderBy("fechaEnvio")
        .onSnapshot(
          snapshot => {
            snapshot.docChanges().forEach(change => {
              if (change.type === "added") {
                let mensaje = change.doc.data();
                this.chat.push(mensaje);
                if (!mensaje.fechaLeido && mensaje.uid !== this.usuario.uid) {
                  this.marcarMensajeLeido(mensaje);
                }
              }
              this.$nextTick(() => {
                if (this.$refs.chatBox) {
                  this.$refs.chatBox.scrollTop = 100000;
                }
              });
            });
          },
          () => {
            this.enviarNotificacion(
              "Ocurrió un error al recuperar los mensajes del chat",
              "error"
            );
          }
        );
    },
    async marcarMensajeLeido(mensaje) {
      let batch = db.batch();
      batch.update(
        db
          .collection("contactos")
          .doc(this.cid)
          .collection("chat")
          .doc(mensaje.id),
        { fechaLeido: new Date() }
      );
      batch.delete(
        db
          .collection("usuarios")
          .doc(this.usuario.uid)
          .collection("chat-sin-leer")
          .doc(mensaje.id)
      );
      await batch.commit();
    },
    convertirFecha(fecha) {
      return fecha
        .toDate()
        .toISOString()
        .substring(0, 16)
        .replace("T", " ");
    },
    onResize() {
      this.height = window.innerHeight - 252;
    }
  }
};
</script>

<style>
.usuario-seleccionado,
.usuario-seleccionado:hover {
  background-color: #fad41035 !important;
}
.chat-mensaje-izq {
  font-size: 13px;
  font-family: "Roboto Slab", serif !important;
  border-radius: 10px;
  text-align: start;
}
.chat-mensaje-der {
  font-size: 13px;
  font-family: "Roboto Slab", serif !important;
  border-radius: 10px;
  text-align: end;
}
.chat-fecha-izq {
  font-size: 0.8rem;
  margin: 3px;
  color: #929292;
  text-align: start;
}
.chat-fecha-der {
  font-size: 0.8rem;
  margin: 3px;
  color: #929292;
  text-align: end;
}
.chat-input {
  border-radius: 30px !important;
  background-color: #d8d3d3 !important;
  padding: 15px 30px;
}
</style>
