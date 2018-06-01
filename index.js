//Create a random challenge, should be provided by the server
let challengeNumbers = [];
for (var i = 0; i < 32; i++) {
  challengeNumbers.push(Math.random()*255);
}

//Start with a clean slate
localStorage.removeItem("publicKeyCredentials");

const binToStr = (bin) => {
  return btoa(new Uint8Array(bin).reduce(
      (s, byte) => s + String.fromCharCode(byte), ''
  ));
};

const strToBin = (str) => {
  return Uint8Array.from(atob(str), c => c.charCodeAt(0));
};

let challenge = new Uint8Array(challengeNumbers);
let pubKeyCredParams = [{
  type: "public-key",
  alg: -7 //cose_alg_ECDSA_w_SHA256
}];
let rp = {
  name: "WebAuthn Demo"
};

let email = document.querySelector("#username").value;

let user = {
  name: "email",
  displayName: "Demo User",
  id: new TextEncoder("utf-8").encode("email")
};

let publicKey = {challenge, pubKeyCredParams, rp, user};


document.querySelector("#register").addEventListener("click", () => {
  navigator.credentials.create({publicKey})
      .then(attestation => {
        const publicKeyCredential = {};

        publicKeyCredential.id = attestation.id;
        publicKeyCredential.type = attestation.type;
        publicKeyCredential.rawId = binToStr(attestation.rawId);

        if (!attestation.response) {
          addErrorMsg("Make Credential response lacking 'response' attribute");
        }

        const response = {};
        response.clientDataJSON = binToStr(attestation.response.clientDataJSON);
        response.attestationObject = binToStr(attestation.response.attestationObject);
        publicKeyCredential.response = response;

        //Store everything in localStorage
        let storage = localStorage.getItem("publicKeyCredentials") || "[]";
        storage = JSON.parse(storage);
        storage.push(publicKeyCredential);

        localStorage.setItem("publicKeyCredentials", JSON.stringify(storage));

      });
});

document.querySelector("#authenticate").addEventListener("click", () => {
  const storedCredentials = JSON.parse(localStorage.getItem("publicKeyCredentials") || "[]");

  let allowCredentials = [];
  storedCredentials.map(cred => {
    allowCredentials.push({
      type: "public-key",
      id: strToBin(cred.rawId),
      transports: ["usb"]
    });
  });

  let publicKey = {challenge, allowCredentials};

  navigator.credentials.get({publicKey})
      .then(assertion => {
        const publicKeyCredential = {};

        publicKeyCredential.id = assertion.id;
        publicKeyCredential.type = assertion.type;
        publicKeyCredential.rawId = binToStr(assertion.rawId);

        if (!assertion.response) {
          throw "Get assertion response lacking 'response' attribute";
        }

        const _response = assertion.response;

        publicKeyCredential.response = {
          clientDataJSON: binToStr(_response.clientDataJSON),
          authenticatorData: binToStr(_response.authenticatorData),
          signature: binToStr(_response.signature),
          userHandle: binToStr(_response.userHandle)
        };

        // console.log(publicKeyCredential);
        console.log("Credentials validated.  This is a registered key for this user");
        // console.log(publicKeyCredential.response.userHandle);
        // console.log(publicKeyCredential.id);
      }).catch(err => {
        console.log("Invalid credentials.  This key was not registered");
  });
});
