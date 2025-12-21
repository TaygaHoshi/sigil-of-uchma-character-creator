// Global state
let myCharacterData = null;
let currentMainHand = null;
let currentOffHand = null;

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

function ensureUnarmed(weaponList) {
    // 17 is the id of unarmed weapon
    return [17, 17, ...weaponList.filter(id => id !== 17)];
}

function getWeapons(commonData, weaponList) {
    let result = [];

    weaponList = ensureUnarmed(weaponList);

    weaponList.forEach(element => {
        let weaponObject = {...commonData.Weapons.find(item => item.id === Number.parseInt(element))};
        weaponObject.isAvailable = true;
        result.push(weaponObject);
    });

    return result;
}

function sameWeaponExists(select, weapon) {
    return Array.from(select.options)
        .some(option => option.value === String(weapon.id));
}

function updateEquippedGlobals(weaponList) {
    const mainHandSelectElement = document.getElementById('activeMainHand');
    const offHandSelectElement = document.getElementById('activeOffHand');
    const offHandContainer = document.getElementById('activeOffHandContainer');

    currentMainHand = weaponList.find(item => item.id === Number.parseInt(mainHandSelectElement.value));

    if (currentMainHand.Type === "two_hand") {
        offHandContainer.hidden = true;
    }
    else {
        offHandContainer.hidden = false;
    }

    if (offHandContainer.hidden) {
        currentOffHand = null;
    }
    else {
        currentOffHand = weaponList.find(item => item.id === Number.parseInt(offHandSelectElement.value));
    }
    
    console.log(currentMainHand);
    console.log(currentOffHand);
}

function getEquippedGlobalsString() {
    return currentMainHand.Name + (currentOffHand == null ? "" : " | " + currentOffHand.Name);
}

function populateWeaponSelectors(weaponList) {
    const mainHandSelectElement = document.getElementById('activeMainHand');
    const offHandSelectElement = document.getElementById('activeOffHand');
    const offHandContainer = document.getElementById('activeOffHandContainer');

    mainHandSelectElement.innerHTML = '';
    offHandSelectElement.innerHTML = '';
    offHandContainer.hidden = false;

    // add weapon selection options
    weaponList.forEach(weaponObject => {
        const isAvailableInMainhand = weaponObject.isAvailable && !sameWeaponExists(mainHandSelectElement, weaponObject);
        const isAvailableInOffhand = weaponObject.isAvailable && !sameWeaponExists(offHandSelectElement, weaponObject);

        if (isAvailableInMainhand && (weaponObject.Type === "two_hand" || weaponObject.Type === "one_hand")) {
            const opt = document.createElement('option');
            opt.value = weaponObject.id;
            opt.textContent = weaponObject.Name;
            mainHandSelectElement.appendChild(opt);
            weaponObject.isAvailable = false;
        }
        if (isAvailableInOffhand && (weaponObject.Type === "off_hand" || weaponObject.isLight)) {
            const opt = document.createElement('option');
            opt.value = weaponObject.id;
            opt.textContent = weaponObject.Name;
            offHandSelectElement.appendChild(opt);
            weaponObject.isAvailable = false;
        }
    });

    updateEquippedGlobals(weaponList);
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

            // weapons
            let myWeaponObjects = getWeapons(myCommon, myCharacterData.weapons);
            populateWeaponSelectors(myWeaponObjects);
            
            document.getElementById('characterWeapons').innerHTML = getEquippedGlobalsString();
            document.getElementById('characterPrecision').innerHTML = "<b>Precision Roll:</b> " + formatPrecision();

        } catch (error) {
            console.error('Error decoding character data:', error);
        }
    } else {
        // Handle case where 'q' parameter is missing
        globalThis.location.href = "index.html";
    }
});
