<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-toolbar-title>
          Wamas - Browser Extension {{ title }}</q-toolbar-title
        >

        <div>Using Quasar> {{ $q.version }}</div>
        <q-btn color="success" icon="check" label="OK" @click="onClick" />
        <q-btn color="success" icon="check" label="Connect" @click="onXmpp" />
      </q-toolbar>
    </q-header>
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { defineComponent, ref } from "vue";
const { client, xml } = require("@xmpp/client");
const XMPP_DOMAIN = "test.grupomahue.online";
const XMPP_SERVICE = "ws://test.grupomahue.online:40000/ws";
const XMPP_USER = "client1";
const XMPP_PASSWORD = "12345";
const XMPP_RESOURCE = "";
const AGENT_CONTROLLER = "analizer_agent_controller";
//const debug = require("@xmpp/debug");

export default defineComponent({
  name: "MainLayout",

  components: {},
  data() {
    return {
      title: "",
      controllerAgent: "analizer_agent_controller",
      xmppConnection: null,
    };
  },
  mounted: function () {
    this.setupXmppConnection();
  },
  methods: {
    onClick: function () {
      this.$q.bex
        .send("wamas.query.elements.by.tagname", {
          query: "input",
        })
        .then((r) => {
          for (let index = 0; index < r.data.resultado.length; index++) {
            this.$q.bex.send("wamas.set.observation.by.xpath", {
              selector: r.data.resultado[index].fullXPath,
              observationType: "warning",
              observationTitle: "1.10.2",
              observationText: "Alguna observaciones para este item",
            });
          }
        });
    },
    getByTagName: async function (tagName) {
      const r = await this.$q.bex.send("wamas.query.elements.by.tagname", {
        query: tagName,
      });
      return r.data;
    },
    setObservation: function (
      xpath,
      observationType,
      observationTitle,
      observationText
    ) {
      this.$q.bex.send("wamas.set.observation.by.xpath", {
        selector: xpath,
        observationType,
        observationTitle,
        observationText,
      });
    },
    processStanza: async function (stanza) {
      if (stanza.attrs.type && stanza.attrs.type == "chat") {
        for (let index = 0; index < stanza.children.length; index++) {
          if (stanza.children[index].name == "body") {
            const message = JSON.parse(stanza.children[index].children[0]);
            const command = message.method;
            const param = message.param;
            switch (command) {
              case "GETBYTAGNAME":
                let tags = await this.getByTagName(param);
                tags.reason = "RESPONSE";
                tags.responseTo = "GETBYTAGNAME";
                tags.responseToParameter = param;
                console.log("Preparando: ", tags);
                const message = xml(
                  "message",
                  { type: "chat", to: stanza.attrs.from },
                  xml("body", {}, JSON.stringify(tags))
                );
                await this.xmppConnection.send(message);
                console.log("Mensaje enviado: ", message);
                break;
              case "SETOBSERVATION":
                this.setObservation(
                  param.xpath,
                  param.observationType,
                  param.observationTitle
                );
                break;

              default:
                console.log("No se reconoce el comando: ", command, stanza);
                break;
            }
          }
        }
      }
    },
    setupXmppConnection: function () {
      this.xmppConnection = client({
        service: XMPP_SERVICE,
        domain: XMPP_DOMAIN,
        resource: XMPP_RESOURCE,
        username: XMPP_USER,
        password: XMPP_PASSWORD,
      });
      this.xmppConnection.on("error", (err) => {
        console.error(err);
      });
      this.xmppConnection.on("offline", () => {
        console.log("offline");
      });

      this.xmppConnection.on("stanza", async (stanza) => {
        if (stanza.is("message")) {
          this.processStanza(stanza);
        } else {
          console.log("Otro tipo de stanza: ", stanza);
        }
      });

      this.xmppConnection.on("online", async (address) => {
        // Makes itself available
        await this.xmppConnection.send(xml("presence"));
      });
      this.xmppConnection.start().catch(console.error);
    },
    onXmpp: async function () {
      const message = xml(
        "message",
        { type: "chat", to: AGENT_CONTROLLER + "@" + XMPP_DOMAIN },
        xml("body", {}, JSON.stringify({ barrera: "2", reason: "EVALUATE" }))
      );
      await this.xmppConnection.send(message);
      this.setObservation(
        "/html/body/img",
        "error",
        "1.1.1",
        "Todo contenido no textual que se presenta al usuario tiene una alternativa textual que cumple el mismo propósito, excepto en las situaciones enumeradas a continuación."
      );
    },
  },
  setup() {
    const leftDrawerOpen = ref(false);
    //this.$q.bex.on("wamas.query.elements.response", this.gotResponse);
    return {
      toggleLeftDrawer() {
        leftDrawerOpen.value = !leftDrawerOpen.value;
      },
    };
  },
});
</script>
