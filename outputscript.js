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

function getAvailableAbilities(chosenClass, myLevel) {
    if (!Array.isArray(chosenClass.Abilities)) return [];

    const filteredAbilities = chosenClass.Abilities
    .filter(ability => ability.Level <= myLevel)
    .map(ability => 'Level ' + ability.Level + " Ability: " + ability.Name);

    let result = "";
    let myString = "";

    filteredAbilities.forEach(element => {
        myString = '<tr><td colspan="4">';
        myString += element;
        myString += '</td></tr>';
        result += myString;
    });

    return result;
}

function printTechniques(chosenClass, techniqueList) {
    let result = "";
    let myString = "";

    techniqueList.forEach(element => {
        myString = '<tr><td colspan="4">';
        myString += "Technique: " + chosenClass.Techniques.find(item => item.id === Number.parseInt(element)).Name;
        myString += '</td></tr>';
        result += myString;
    });

    return result;
}

function getWeapons(commonData, weaponList) {
    let result = [];

    weaponList.forEach(element => {
        result.push(commonData.Weapons.find(item => item.id === Number.parseInt(element)));
    });

    return result;
}

function printWeapons(mainId, offId) {
    if (!mainId) return "None";

    const mainLabel = getWeaponNameById(mainId) || "None";
    const offLabel = offId ? getWeaponNameById(offId) : null;

    return offLabel ? `${mainLabel} | ${offLabel}` : mainLabel;
}

function formatPrecision(precision) {
    if (precision === 0) return "d10";
    if (precision > 0) return `d10 + ${precision}`;
    return `d10 - ${Math.abs(precision)}`;
}

function prepareResistance(base, name, major, minors) {
  let bonus = 0;

  if (name === major) bonus += 2;
  bonus += minors.filter(minor => minor === name).length;

  return base + bonus;
}

function displayCharacter(characterData, pathData, branchData, commonData) {
    
    // Populate page with characterData
    document.getElementById('page_title').innerHTML = characterData.name + " - Sigil of Uchma Character Creator";
    document.getElementById('characterPlayerName').textContent = characterData.playerName;
    document.getElementById('characterName').textContent = characterData.name;

    const myLevel = Number.parseInt(characterData.level);
    const myBasePrecision = Math.floor(myLevel / 2);
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
    document.getElementById('characterPArmor').innerHTML = "<b>Physical Armor:</b> " + chosenArmor.PArmor;
    document.getElementById('characterMArmor').innerHTML = "<b>Magical Armor:</b> " + chosenArmor.MArmor;

    // weapons
    const myWeapons = getWeapons(commonData, characterData.weapons);
    console.log(myWeapons);
    // const weaponDisplay = printWeapons(currentMainHandId, currentOffHandId);
    // document.getElementById('characterWeapons').innerHTML = weaponDisplay;
    // document.getElementById('characterPrecision').innerHTML = "<b>Precision Roll:</b> " + formatPrecision(precision);

    // class abilities
    document.getElementById('characterPathAbilities').innerHTML = getAvailableAbilities(chosenPath, myLevel);
    document.getElementById('characterBranchAbilities').innerHTML = getAvailableAbilities(chosenBranch, myLevel);

    // class techniques
    document.getElementById('characterPathTechniques').innerHTML = printTechniques(chosenPath, characterData.pathTechniques);
    document.getElementById('characterBranchTechniques').innerHTML = printTechniques(chosenBranch, characterData.branchTechniques);

    // resistances
    const resistanceNames = ["Parry", "Warding", "Constitution", "Evasion"];
    const resistanceBase = commonData.Constants.resistanceBase + Math.floor((myLevel + 1) / 2);

    const myMajor = characterData.majorResistance;
    const myMinors = characterData.minorResistances;

    const myResistances = Object.fromEntries(
      resistanceNames.map(name => [name, prepareResistance(resistanceBase, name, myMajor, myMinors)])
    );
    
    document.getElementById('characterParry').innerHTML = "<b>Parry:</b> " + myResistances.Parry;
    document.getElementById('characterWarding').innerHTML = "<b>Warding:</b> " + myResistances.Warding;
    document.getElementById('characterConstitution').innerHTML = "<b>Constitution:</b> " + myResistances.Constitution;
    document.getElementById('characterEvasion').innerHTML = "<b>Evasion:</b> " + myResistances.Evasion;

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
