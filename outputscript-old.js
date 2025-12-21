// Global state
let myCharacterData = null;
let myCommon = null;
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

function getWeaponData(weaponName) {
    if (!weaponName || weaponName === 'not_selected') return null;
    return myCommon.Weapons.find(w => w.Name === weaponName);
}

function isTwoHanded(weaponName) {
    const weapon = getWeaponData(weaponName);
    return weapon?.Type === 'two_hand';
}

function getWeaponEntryById(id) {
    if (!id || !myCharacterData?.weapons) return null;
    return myCharacterData.weapons.find(w => w.id === id) || null;
}

function getWeaponNameById(id) {
    return getWeaponEntryById(id)?.name || null;
}

function getEquipSlots(weaponName) {
    const weapon = getWeaponData(weaponName);
    if (!weapon) return { canMain: false, canOff: false };

    if (weapon.Type === 'two_hand') return { canMain: true, canOff: false };
    if (weapon.Type === 'off_hand') return { canMain: false, canOff: true };

    // one-handed weapons: light can be off-hand, heavy cannot
    const canOff = !!weapon.isLight;
    return { canMain: true, canOff };
}

function buildWeaponDisplayNames(weapons) {
    const nameCount = {};
    const labels = {};

    weapons.forEach(w => {
        nameCount[w.name] = (nameCount[w.name] || 0) + 1;
        const suffix = nameCount[w.name] > 1 ? `-${nameCount[w.name]}` : '';
        labels[w.id] = w.name + suffix;
    });

    return labels;
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

function normalizeWeapons(characterData) {
    if (!characterData) return;

    let weaponsArray = [];

    if (Array.isArray(characterData.weapons)) {
        weaponsArray = characterData.weapons
            .map((w, index) => {
                if (typeof w === 'string') {
                    return { id: `w${index + 1}`, name: w };
                }
                return { id: w.id || `w${index + 1}`, name: w.name };
            })
            .filter(w => w.name && w.name !== 'not_selected');
    } else {
        const legacyWeapons = [
            characterData.mainWeapon1,
            characterData.offWeapon1,
            characterData.mainWeapon2,
            characterData.offWeapon2
        ].filter(v => v && v !== 'not_selected');

        weaponsArray = legacyWeapons.map((name, index) => ({
            id: `w${index + 1}`,
            name
        }));
    }

    characterData.weapons = weaponsArray;
}

function printAbilities(abilityArray, isTechnique) {
    let result = "";
    let myString = "";

    abilityArray.forEach(element => {
        myString = '<tr><td colspan="4">';
        myString += isTechnique ? "Technique: " + element : element;
        myString += '</td></tr>';
        result += myString;
    });

    return result;
}

function updateWeaponStats() {
    if (!myCharacterData || !myCommon) return;

    const mainWeaponName = getWeaponNameById(currentMainHandId);
    const offWeaponName = getWeaponNameById(currentOffHandId);

    const mainWeapon = getWeaponData(mainWeaponName);
    const offWeapon = offWeaponName ? getWeaponData(offWeaponName) : null;

    // calculate precision
    const precisionBase = Math.floor(myCharacterData.level / 2);
    let precision = precisionBase + (mainWeapon ? mainWeapon.Precision : 0);
    // Off-hand modifies precision only when the item is an off-hand type (shields, charms, etc.)
    if (offWeapon?.Type === 'off_hand') {
        precision += offWeapon.Precision;
    }

    // calculate armor bonuses
    const baseArmor = myCommon.Armors.find(a => a.Name === myCharacterData.armor);
    let pArmor = baseArmor ? baseArmor.PArmor : 0;
    let mArmor = baseArmor ? baseArmor.MArmor : 0;

    if (mainWeapon) {
        pArmor += mainWeapon.PArmor;
        mArmor += mainWeapon.MArmor;
    }
    if (offWeapon) {
        pArmor += offWeapon.PArmor;
        mArmor += offWeapon.MArmor;
    }

    // calculate resistances
    const myResistances = {
        Parry: myCharacterData.resistances.Parry,
        Warding: myCharacterData.resistances.Warding,
        Constitution: myCharacterData.resistances.Constitution,
        Evasion: myCharacterData.resistances.Evasion
    };

    if (mainWeapon) {
        if (mainWeapon.Parry) myResistances.Parry += mainWeapon.Parry;
        if (mainWeapon.Warding) myResistances.Warding += mainWeapon.Warding;
    }
    if (offWeapon) {
        if (offWeapon.Parry) myResistances.Parry += offWeapon.Parry;
        if (offWeapon.Warding) myResistances.Warding += offWeapon.Warding;
    }

    // update display
    const weaponDisplay = printWeapons(currentMainHandId, currentOffHandId);
    
    document.getElementById('characterWeapons').innerHTML = weaponDisplay;
    document.getElementById('characterPrecision').innerHTML = "<b>Precision Roll:</b> " + formatPrecision(precision);
    
    document.getElementById('characterPArmor').innerHTML = "<b>Physical Armor:</b> " + pArmor;
    document.getElementById('characterMArmor').innerHTML = "<b>Magical Armor:</b> " + mArmor;
    
    document.getElementById('characterParry').innerHTML = "<b>Parry:</b> " + myResistances.Parry;
    document.getElementById('characterWarding').innerHTML = "<b>Warding:</b> " + myResistances.Warding;
    document.getElementById('characterConstitution').innerHTML = "<b>Constitution:</b> " + myResistances.Constitution;
    document.getElementById('characterEvasion').innerHTML = "<b>Evasion:</b> " + myResistances.Evasion;
}

function populateWeaponSelectors() {
    const mainHandSelectElement = document.getElementById('activeMainHand');
    const offHandSelectElement = document.getElementById('activeOffHand');
    const offHandContainer = document.getElementById('activeOffHandContainer');

    if (!myCharacterData?.weapons || myCharacterData.weapons.length === 0) {
        mainHandSelectElement.innerHTML = '<option value="">No weapons selected</option>';
        offHandSelectElement.innerHTML = '<option value="">None</option>';
        offHandContainer.hidden = true;
        currentMainHandId = null;
        currentOffHandId = null;
        updateWeaponStats();
        return;
    }

    weaponDisplayNames = buildWeaponDisplayNames(myCharacterData.weapons);

    const mainOptions = myCharacterData.weapons.filter(w => getEquipSlots(w.name).canMain);

    if (mainOptions.length === 0) {
        mainHandSelectElement.innerHTML = '<option value="">No main-hand options</option>';
        offHandSelectElement.innerHTML = '<option value="">None</option>';
        offHandContainer.hidden = true;
        currentMainHandId = null;
        currentOffHandId = null;
        updateWeaponStats();
        return;
    }

    mainHandSelectElement.innerHTML = '';

    mainOptions.forEach(w => {
        const opt = document.createElement('option');
        opt.value = w.id;
        opt.textContent = weaponDisplayNames[w.id] || w.name;
        mainHandSelectElement.appendChild(opt);
    });

    const fallbackMainId = mainOptions[0]?.id || '';
    const selectedMainId = mainOptions.some(w => w.id === currentMainHandId) ? currentMainHandId : fallbackMainId;
    currentMainHandId = selectedMainId || null;
    mainHandSelectElement.value = selectedMainId;

    mainHandSelectElement.onchange = () => {
        currentMainHandId = mainHandSelectElement.value || null;
        updateOffHandOptions();
    };

    offHandSelectElement.onchange = () => {
        currentOffHandId = offHandSelectElement.value || null;
        updateWeaponStats();
    };

    updateOffHandOptions();
}

function updateOffHandOptions() {
    const mainHandSelectElement = document.getElementById('activeMainHand');
    const offHandSelectElement = document.getElementById('activeOffHand');
    const offHandContainer = document.getElementById('activeOffHandContainer');

    currentMainHandId = mainHandSelectElement.value || null;

    const mainWeaponName = getWeaponNameById(currentMainHandId);

    if (!mainWeaponName || isTwoHanded(mainWeaponName)) {
        offHandContainer.hidden = true;
        currentOffHandId = null;
        offHandSelectElement.innerHTML = '<option value="">None</option>';
        updateWeaponStats();
        return;
    }

    const offOptions = myCharacterData.weapons.filter(w => w.id !== currentMainHandId && getEquipSlots(w.name).canOff);

    offHandContainer.hidden = false;
    offHandSelectElement.innerHTML = '<option value="">None</option>';

    offOptions.forEach(w => {
        const opt = document.createElement('option');
        opt.value = w.id;
        opt.textContent = weaponDisplayNames[w.id] || w.name;
        offHandSelectElement.appendChild(opt);
    });

    const fallbackOffId = offOptions[0]?.id || '';
    const selectedOffId = offOptions.some(w => w.id === currentOffHandId) ? currentOffHandId : fallbackOffId;
    currentOffHandId = selectedOffId || null;
    offHandSelectElement.value = selectedOffId;

    updateWeaponStats();
}

function displayCharacter(characterData) {
    // Populate page with characterData
    document.getElementById('page_title').innerHTML = characterData.name + " - Sigil of Uchma Character Creator";
    document.getElementById('characterPlayerName').textContent = characterData.playerName;

    // base stuff
    document.getElementById('characterName').textContent = characterData.name;
    document.getElementById('characterLevel').textContent = "Level " + characterData.level;
    document.getElementById('characterPath').textContent = characterData.path + "/" + characterData.branch;

    document.getElementById('characterHealth').innerHTML = "<b>Health:</b> " + characterData.health;
    document.getElementById('characterEnergy').innerHTML = "<b>Energy:</b> " + characterData.energy;

    document.getElementById('characterPotency').innerHTML = "<b>Potency:</b> " + characterData.potency;
    document.getElementById('characterControl').innerHTML = "<b>Control:</b> " + characterData.control;

    document.getElementById('characterSpeed').innerHTML = "<b>Movement:</b> " + characterData.movementSpeed + " meters";
    
    // armor
    document.getElementById('characterArmor').innerHTML = "<b>Armor Type:</b> " + characterData.armor;

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
    const params = new URLSearchParams(window.location.search);
    const base64String = params.get('q');

    // read common data
    myCommon = await readCommon();

    document.getElementById("copyButton").addEventListener("click", () => {
        const qRaw = new URLSearchParams(window.location.search).get('q');
        const qReEncoded = encodeURIComponent(qRaw);
        const finalUrl = `${location.origin}${location.pathname}?q=${qReEncoded}`;

        console.log(finalUrl);

        navigator.clipboard.writeText(finalUrl)
        .then(() => alert("Copied the share link."))
        .catch(() => alert("Failed to copy the share link."));
    });

    if (base64String) {
        try {
            const jsonString = decodeBase64ToUnicode(base64String);
            myCharacterData = JSON.parse(jsonString);
            normalizeWeapons(myCharacterData);

            displayCharacter(myCharacterData);
            populateWeaponSelectors();

        } catch (error) {
            console.error('Error decoding character data:', error);
            // Handle error (e.g., display a message to the user)
        }
    } else {
        // Handle case where 'q' parameter is missing
        globalThis.location.href = "index.html";
    }
});
