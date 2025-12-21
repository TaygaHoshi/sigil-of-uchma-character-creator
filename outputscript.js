// Global state
let myCharacterData = null;
let currentMainHandId = null;
let currentOffHandId = null;
let weaponDisplayNames = {};

async function readPaths() {
  try {
    const response = await fetch('paths.json');
    return await response.json();
  } catch (err) {
    console.error('Error loading paths.json:', err);
    throw err;
  }
}

async function readBranches() {
  try {
    const response = await fetch('branches.json');
    return await response.json();
  } catch (err) {
    console.error('Error loading branches.json:', err);
    throw err;
  }
}

async function readCommon() {
  try {
    const response = await fetch('common.json');
    return await response.json();
  } catch (err) {
    console.error('Error loading common.json:', err);
    throw err;
  }
}

function decodeBase64ToUnicode(base64) {
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, c => c.codePointAt(0));
    const decompressed = pako.ungzip(bytes, { to: 'string' });
    return JSON.parse(decompressed);
}

function displayCharacter(characterData, pathData, branchData, commonData) {
    // Populate page with characterData
    document.getElementById('page_title').innerHTML = characterData.name + " - Sigil of Uchma Character Creator";
    document.getElementById('characterPlayerName').textContent = characterData.playerName;
    document.getElementById('characterName').textContent = characterData.name;

    const myLevel = Number.parseInt(characterData.level);
    document.getElementById('characterLevel').textContent = "Level " + myLevel;

    // path
    const pathName = characterData.path;
    const chosenPath = pathData[pathName];
    

    // branch
    const branchName = characterData.branch;
    const chosenBranch = branchData[branchName];

    // base stuff
    document.getElementById('characterPath').textContent = pathName + "/" + branchName;

    document.getElementById('characterHealth').innerHTML = "<b>Health:</b> " + chosenPath.Health;
    
    const myEnergy = commonData.Constants.energyBase + commonData.Constants.energyScaling * Math.floor(myLevel/2);
    document.getElementById('characterEnergy').innerHTML = "<b>Energy:</b> " + myEnergy;

    document.getElementById('characterPotency').innerHTML = "<b>Potency:</b> " + characterData.potency;
    document.getElementById('characterControl').innerHTML = "<b>Control:</b> " + characterData.control;
    
    // armor
    const chosenArmor = commonData.Armors.find(item => item.id === Number.parseInt(characterData.armor));
    document.getElementById('characterArmor').innerHTML = "<b>Armor Type:</b> " + chosenArmor.Name;
    document.getElementById('characterSpeed').innerHTML = "<b>Movement:</b> " + chosenArmor.Speed + " meters";

    // abilities
    document.getElementById('characterPathAbilities').innerHTML = printAbilities(characterData.pathAbilities, false);
    document.getElementById('characterBranchAbilities').innerHTML = printAbilities(characterData.branchAbilities, false);

    // techniques
    document.getElementById('characterPathTechniques').innerHTML = printAbilities(characterData.pathTechniques, true);
    document.getElementById('characterBranchTechniques').innerHTML = printAbilities(characterData.branchTechniques, true);

    // pet
    if (characterData.pathPet && characterData.pathPet !== "not_selected") {
        document.getElementById('characterPathPet').hidden = false;
        document.getElementById('characterPetsHeader').hidden = false;

        document.getElementById('characterPathPet').innerHTML = "<td colspan='4'>" + characterData.pathPet + "</td>";
    }

    if (characterData.branchPet && characterData.branchPet !== "not_selected") {
        document.getElementById('characterBranchPet').hidden = false;
        document.getElementById('characterPetsHeader').hidden = false;
        
        document.getElementById('characterBranchPet').innerHTML = "<td colspan='4'>" + characterData.branchPet + "</td>";
    }
    

}

globalThis.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(globalThis.location.search);
    const base64String = params.get('q');

    // read data
    const myPaths = await readPaths();
    const myBranches = await readBranches();
    const myCommon = await readCommon();


    document.getElementById("copyButton").addEventListener("click", () => {
        const qRaw = new URLSearchParams(globalThis.location.search).get('q');
        const qReEncoded = encodeURIComponent(qRaw);
        const finalUrl = `${location.origin}${location.pathname}?q=${qReEncoded}`;

        navigator.clipboard.writeText(finalUrl)
        .then(() => alert("Copied the share link."))
        .catch(() => alert("Failed to copy the share link."));
    });

    if (base64String) {
        try {
            myCharacterData = decodeBase64ToUnicode(base64String);
            //normalizeWeapons(myCharacterData);

            displayCharacter(myCharacterData, myPaths, myBranches, myCommon);
            populateWeaponSelectors();

        } catch (error) {
            console.error('Error decoding character data:', error);
        }
    } else {
        // Handle case where 'q' parameter is missing
        globalThis.location.href = "index.html";
    }
});
