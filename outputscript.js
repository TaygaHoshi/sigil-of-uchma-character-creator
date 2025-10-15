// Global state
let myCharacterData = null;
let myCommon = null;
let currentMainHand = null;
let currentOffHand = null;

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
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    const decompressed = pako.ungzip(bytes, { to: 'string' });
    return JSON.parse(decompressed);
}

function getWeaponData(weaponName) {
    if (!weaponName || weaponName === 'not_selected') return null;
    return myCommon.Weapons.find(w => w.Name === weaponName);
}

function isTwoHanded(weaponName) {
    const weapon = getWeaponData(weaponName);
    return weapon && weapon.Type === 'two_hand';
}

function isLightWeapon(weaponName) {
    const weapon = getWeaponData(weaponName);
    return weapon && weapon.isLight;
}

function printWeapons(mainW, offW) {
    return offW != "not_selected" ? mainW + " | " + offW : mainW;
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
    if (!myCharacterData || !myCommon || !currentMainHand) return;

    const mainWeapon = getWeaponData(currentMainHand);
    const offWeapon = currentOffHand !== 'not_selected' ? getWeaponData(currentOffHand) : null;

    // calculate precision
    const precisionBase = Math.floor(myCharacterData.level / 2);
    let precision = precisionBase + (mainWeapon ? mainWeapon.Precision : 0);
    if (currentOffHand === 'Charm' && offWeapon) {
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

    // calculate initiative
    let initiative = baseArmor ? baseArmor.Initiative : 0;
    if (mainWeapon && mainWeapon.Initiative) initiative += mainWeapon.Initiative;
    if (offWeapon && offWeapon.Initiative) initiative += offWeapon.Initiative;

    // update display
    const weaponDisplay = printWeapons(currentMainHand, currentOffHand);
    
    document.getElementById('characterWeapons').innerHTML = weaponDisplay;
    document.getElementById('characterPrecision').innerHTML = "<b>Precision Roll:</b> d10 + " + precision;
    
    document.getElementById('characterPArmor').innerHTML = "<b>Physical Armor:</b> " + pArmor;
    document.getElementById('characterMArmor').innerHTML = "<b>Magical Armor:</b> " + mArmor;
    
    document.getElementById('characterParry').innerHTML = "<b>Parry:</b> " + myResistances.Parry;
    document.getElementById('characterWarding').innerHTML = "<b>Warding:</b> " + myResistances.Warding;
    document.getElementById('characterConstitution').innerHTML = "<b>Constitution:</b> " + myResistances.Constitution;
    document.getElementById('characterEvasion').innerHTML = "<b>Evasion:</b> " + myResistances.Evasion;
    
    document.getElementById('characterInitiative').innerHTML = "<b>Initiative:</b> " + initiative;
}

function populateWeaponSelectors() {
    const mainHandSelectElement = document.getElementById('activeMainHand');
    const offHandSelectElement = document.getElementById('activeOffHand');
    const offHandContainer = document.getElementById('activeOffHandContainer');

    const mh1 = myCharacterData.mainWeapon1;
    const mh2 = myCharacterData.mainWeapon2;
    const oh1 = myCharacterData.offWeapon1;
    const oh2 = myCharacterData.offWeapon2;

    // Create array of all weapons to track duplicates
    const weapons = [];
    if (mh1 !== 'not_selected') weapons.push({ name: mh1, slot: 'mh1' });
    if (mh2 !== 'not_selected') weapons.push({ name: mh2, slot: 'mh2' });
    if (oh1 !== 'not_selected') weapons.push({ name: oh1, slot: 'oh1' });
    if (oh2 !== 'not_selected') weapons.push({ name: oh2, slot: 'oh2' });

    // Track weapon name occurrences to add suffix
    const nameCount = {};
    const displayNames = {};
    weapons.forEach(w => {
        nameCount[w.name] = (nameCount[w.name] || 0) + 1;
        const suffix = nameCount[w.name] > 1 ? `-${nameCount[w.name]}` : '';
        displayNames[w.slot] = w.name + suffix;
    });

    // Populate main hand
    mainHandSelectElement.innerHTML = '';

    if (oh1 !== 'not_selected' && isLightWeapon(oh1)) {
        const opt = document.createElement('option');
        opt.value = 'oh1';
        opt.textContent = displayNames['oh1'];
        opt.dataset.weaponName = oh1;
        mainHandSelectElement.appendChild(opt);
    }

    if (oh2 !== 'not_selected' && isLightWeapon(oh2)) {
        const opt = document.createElement('option');
        opt.value = 'oh2';
        opt.textContent = displayNames['oh2'];
        opt.dataset.weaponName = oh2;
        mainHandSelectElement.appendChild(opt);
    }
    
    if (mh1 !== 'not_selected') {
        const opt1 = document.createElement('option');
        opt1.value = 'mh1';
        opt1.textContent = displayNames['mh1'];
        opt1.dataset.weaponName = mh1;
        mainHandSelectElement.appendChild(opt1);
    }
    
    if (mh2 !== 'not_selected') {
        const opt2 = document.createElement('option');
        opt2.value = 'mh2';
        opt2.textContent = displayNames['mh2'];
        opt2.dataset.weaponName = mh2;
        mainHandSelectElement.appendChild(opt2);
    }

    currentMainHand = mainHandSelectElement.selectedOptions[0]?.dataset.weaponName || 'not_selected';

    mainHandSelectElement.addEventListener('change', updateOffHandOptions);
    offHandSelectElement.addEventListener('change', () => {
        currentOffHand = offHandSelectElement.selectedOptions[0]?.dataset.weaponName || 'not_selected';
        updateWeaponStats();
    });

    updateOffHandOptions();
}

function updateOffHandOptions() {
    const mainHandSelectElement = document.getElementById('activeMainHand');
    const offHandSelectElement = document.getElementById('activeOffHand');
    const offHandContainer = document.getElementById('activeOffHandContainer');

    const mh1 = myCharacterData.mainWeapon1;
    const mh2 = myCharacterData.mainWeapon2;
    const oh1 = myCharacterData.offWeapon1;
    const oh2 = myCharacterData.offWeapon2;

    const currentMainHandSlot = mainHandSelectElement.value;
    
    // Map slot to weapon name
    const slotToWeapon = {
        'mh1': mh1,
        'mh2': mh2,
        'oh1': oh1,
        'oh2': oh2
    };
    
    currentMainHand = slotToWeapon[currentMainHandSlot] || 'not_selected';

    // Create array of all weapons to track duplicates
    const weapons = [];
    if (mh1 !== 'not_selected') weapons.push({ name: mh1, slot: 'mh1' });
    if (mh2 !== 'not_selected') weapons.push({ name: mh2, slot: 'mh2' });
    if (oh1 !== 'not_selected') weapons.push({ name: oh1, slot: 'oh1' });
    if (oh2 !== 'not_selected') weapons.push({ name: oh2, slot: 'oh2' });

    // Track weapon name occurrences to add suffix
    const nameCount = {};
    const displayNames = {};
    weapons.forEach(w => {
        nameCount[w.name] = (nameCount[w.name] || 0) + 1;
        const suffix = nameCount[w.name] > 1 ? `-${nameCount[w.name]}` : '';
        displayNames[w.slot] = w.name + suffix;
    });
    
    if (isTwoHanded(currentMainHand)) {
        offHandContainer.hidden = true;
        currentOffHand = 'not_selected';
    } else {
        offHandContainer.hidden = false;
        
        offHandSelectElement.innerHTML = '<option value="not_selected">None</option>';

        if (oh1 !== 'not_selected' && currentMainHandSlot !== 'oh1') {
            const opt = document.createElement('option');
            opt.value = 'oh1';
            opt.textContent = displayNames['oh1'];
            opt.dataset.weaponName = oh1;
            offHandSelectElement.appendChild(opt);
        }
        if (oh2 !== 'not_selected' && currentMainHandSlot !== 'oh2') {
            const opt = document.createElement('option');
            opt.value = 'oh2';
            opt.textContent = displayNames['oh2'];
            opt.dataset.weaponName = oh2;
            offHandSelectElement.appendChild(opt);
        }
        if (mh1 !== 'not_selected' && currentMainHandSlot !== 'mh1' && isLightWeapon(mh1)) {
            const opt = document.createElement('option');
            opt.value = 'mh1';
            opt.textContent = displayNames['mh1'];
            opt.dataset.weaponName = mh1;
            offHandSelectElement.appendChild(opt);
        }
        if (mh2 !== 'not_selected' && currentMainHandSlot !== 'mh2' && isLightWeapon(mh2)) {
            const opt = document.createElement('option');
            opt.value = 'mh2';
            opt.textContent = displayNames['mh2'];
            opt.dataset.weaponName = mh2;
            offHandSelectElement.appendChild(opt);
        }
        
        currentOffHand = offHandSelectElement.selectedOptions[0]?.dataset.weaponName || 'not_selected';
    }
    
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

window.addEventListener('DOMContentLoaded', async () => {
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

            displayCharacter(myCharacterData);
            populateWeaponSelectors();

        } catch (error) {
            console.error('Error decoding character data:', error);
            // Handle error (e.g., display a message to the user)
        }
    } else {
        // Handle case where 'q' parameter is missing
        window.location.href = "index.html";
    }
});