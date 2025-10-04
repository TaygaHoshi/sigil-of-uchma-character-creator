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
    if (!myCharacterData) return;

    const mainHandSelectElement = document.getElementById('activeMainHand');
    const offHandSelectElement = document.getElementById('activeOffHand');
    const offHandContainer = document.getElementById('activeOffHandContainer');

    // populate main hand
    mainHandSelectElement.innerHTML = '';
    
    if (myCharacterData.mainWeapon1 !== 'not_selected') {
        const opt1 = document.createElement('option');
        opt1.value = myCharacterData.mainWeapon1;
        opt1.textContent = myCharacterData.mainWeapon1;
        mainHandSelectElement.appendChild(opt1);
    }
    
    if (myCharacterData.mainWeapon2 !== 'not_selected' && 
        myCharacterData.mainWeapon2 !== myCharacterData.mainWeapon1) {
        const opt2 = document.createElement('option');
        opt2.value = myCharacterData.mainWeapon2;
        opt2.textContent = myCharacterData.mainWeapon2;
        mainHandSelectElement.appendChild(opt2);
    }

    currentMainHand = mainHandSelectElement.value;

    function updateOffHandOptions() {
        currentMainHand = mainHandSelectElement.value;
        
        if (isTwoHanded(currentMainHand)) {
            offHandContainer.hidden = true;
            currentOffHand = 'not_selected';
        } else {
            offHandContainer.hidden = false;
            
            offHandSelectElement.innerHTML = '<option value="not_selected">None</option>';

            if (myCharacterData.offWeapon1 !== 'not_selected') {
                    const opt = document.createElement('option');
                    opt.value = myCharacterData.offWeapon1;
                    opt.textContent = myCharacterData.offWeapon1;
                    offHandSelectElement.appendChild(opt);
                    offHandSelectElement.value = myCharacterData.offWeapon1;
            }
            if (myCharacterData.offWeapon2 !== 'not_selected') {
                    const opt = document.createElement('option');
                    opt.value = myCharacterData.offWeapon2;
                    opt.textContent = myCharacterData.offWeapon2;
                    offHandSelectElement.appendChild(opt);
                    offHandSelectElement.value = myCharacterData.offWeapon2;
            }
            
            currentOffHand = offHandSelectElement.value;
        }
        
        updateWeaponStats();
    }

    mainHandSelectElement.addEventListener('change', updateOffHandOptions);
    offHandSelectElement.addEventListener('change', () => {
        currentOffHand = offHandSelectElement.value;
        updateWeaponStats();
    });

    updateOffHandOptions();
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