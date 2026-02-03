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

async function readNames() {
  try {
    const response = await fetch('names.json');
    return await response.json();
  } catch (err) {
    console.error('Error loading names.json:', err);
    throw err;
  }
}

function populateClass(selectElement, classes) {
  if (!classes) {
    selectElement.innerHTML = '<option value="">An error has occurred.</option>';;
    return false;
  }

  selectElement.innerHTML = '<option value="not_selected">Not selected</option>';

  Object.keys(classes).forEach(className => {
    const opt = document.createElement('option');
    opt.value = className;
    opt.textContent = className;
    selectElement.appendChild(opt);
  });
  return true;
}

function populateArmor(selectElement, commonData) {
  if (!commonData) {
    selectElement.innerHTML = '<option value="">An error has occurred.</option>';
    return false;
  }

  selectElement.innerHTML = '';

  commonData["Armors"].forEach(armorObject => {
    const opt = document.createElement('option');
    opt.value = armorObject.id;
    opt.textContent = armorObject.Name;
    selectElement.appendChild(opt);
  });
  return true;
}

function populateSkill(selectElement, commonData) {
  if (!commonData) {
    selectElement.innerHTML = '<option value="">An error has occurred.</option>';
    return false;
  }

  selectElement.innerHTML = '<option value="not_selected">Not selected</option>';

  commonData.Skills.forEach(skillObject => {
    const opt = document.createElement('option');
    opt.value = skillObject.id;
    opt.textContent = skillObject.Name;
    selectElement.appendChild(opt);
  });
  return true;
}

function populateWeapon(selectElement, commonData, isMainHand) {
  if (!commonData) {
    selectElement.innerHTML = '<option value="">An error has occurred.</option>';
    return false;
  }

  selectElement.innerHTML = '';

  commonData.Weapons.forEach(weaponObject => {
    if (
      weaponObject.Name != "HORIZONTAL_RULE" &&
      ((isMainHand && weaponObject.Type != "off_hand") ||
        (!isMainHand && weaponObject.Type == "off_hand") ||
        (!isMainHand && weaponObject.isLight))
    ) {
      const opt = document.createElement('option');
      opt.value = weaponObject.id;
      opt.textContent = weaponObject.Name;
      selectElement.appendChild(opt);
    }

    if (weaponObject.Name == "HORIZONTAL_RULE") {
      const hr = document.createElement('hr');
      selectElement.appendChild(hr);
    }
  });
  
  // unarmed id is 17
  selectElement.value = 17; 

  return true;
}

function weaponConstraint(selectElement, offhandElement, commonData) {
  const selected = selectElement.value;

  if (selected == "not_selected") {
    return true;
  }

  const result = commonData.Weapons.find(item => item.id === Number.parseInt(selected));

  if (result.Type == "two_hand") {
    // Two-handed selection: hide and clear off-hand so stale values are not submitted
    offhandElement.hidden = true;
    offhandElement.value = "not_selected";
  } else {
    // One-handed or off-hand weapon: show and reset to not selected
    offhandElement.hidden = false;
    offhandElement.value = 17;
  }

}

function enforceExclusive(container) {
  const selects = Array.from(
    container.querySelectorAll('select[id*="_selection_"]')
  );
  // Gather all chosen techniques (ignore “not_selected”)
  const chosen = new Set(selects
    .map(s => s.value)
    .filter(v => v !== "not_selected"));

  selects.forEach(s => {
    Array.from(s.options).forEach(opt => {
      if (opt.value === "not_selected") return;
      // Disable if it’s chosen somewhere else
      opt.disabled = chosen.has(opt.value) && s.value !== opt.value;
    });
  });
}

function populateTechnique(selectedElement, selectedClass, classData) {

  selectedElement.querySelectorAll('select[id*="_technique_selection_"]').forEach(select => {

    select.innerHTML = '<option value="not_selected">Not selected</option>';

    const isStarterSlot = select.id.endsWith('_technique_selection_1');
    console.log(isStarterSlot);

    classData[selectedClass]["Techniques"].forEach(techniqueElement => {
      if (!isStarterSlot || techniqueElement?.Starter !== false) {
        const opt = document.createElement('option');
        opt.value = techniqueElement.id;
        opt.textContent = techniqueElement.Name;
        select.appendChild(opt);
      }
      else {
        console.log("Skipping technique:", techniqueElement.Name);
      }
    });

    select.disabled = false;
  });
}

function setTechniqueCount(container, newCount, isPath) {
  // Grab the label and the one existing <select> to copy from
  const label = container.children[0];
  const existingSelect = container.querySelector('select');

  if (newCount > 5) {
    newCount = 5;
  }

  // Capture its visibility and a static clone-list of its options
  const wasHidden = existingSelect.hidden;
  const optionClones = Array.from(existingSelect.options).map(opt => opt.cloneNode(true));

  // Wipe out everything but the label
  container.innerHTML = '';
  container.appendChild(label);

  // Rebuild exactly newCount selects
  const prefix = isPath ? 'path_technique_selection_' : 'branch_technique_selection_';
  for (let i = 1; i <= newCount; i++) {
    const sel = document.createElement('select');
    sel.id = `${prefix}${i}`;
    sel.hidden = wasHidden;
    sel.classList.add('form-control', 'mb-2');

    //optionClones.forEach(opt => sel.appendChild(opt.cloneNode(true)));
    container.appendChild(sel);
  }
}

function populatePets(divElement, selectedClass, classData) {
  // get the <select> inside the div
  const petSelectElement = divElement.querySelector('select');

  petSelectElement.innerHTML = '';

  // check if the chosen class has pets
  if (classData[selectedClass]?.["Pets"]) {

    const defaultOpt = document.createElement('option');
    defaultOpt.value = 'not_selected';
    defaultOpt.textContent = 'Not selected';
    petSelectElement.appendChild(defaultOpt);

    classData[selectedClass]["Pets"].forEach(pet => {
      const opt = document.createElement('option');
      opt.value = pet["Name"];
      opt.textContent = pet["Name"];
      petSelectElement.appendChild(opt);
    });

    // unhide and enable if there are pets
    divElement.hidden = false;
    petSelectElement.disabled = false;

    return true;
  } else {
    // hide and disable if no pets
    divElement.hidden = true;
    petSelectElement.disabled = true;

    return false;
  }
}

function populatePetDamageType(divElement, selectedPet) {
  const petDamageSelectElement = divElement.querySelector('select');

  petDamageSelectElement.innerHTML = '';

  if (!selectedPet) {
    divElement.hidden = true;
    return;
  }
  else {
    divElement.hidden = false;
  }

  if (!selectedPet.DamageTypeArmorIgnoring) {
    const physicalDamagePet = document.createElement('option');
    physicalDamagePet.value = 'Physical';
    physicalDamagePet.textContent = 'Physical';
    petDamageSelectElement.appendChild(physicalDamagePet);

    const magicalDamagePet = document.createElement('option');
    magicalDamagePet.value = 'Magical';
    magicalDamagePet.textContent = 'Magical';
    petDamageSelectElement.appendChild(magicalDamagePet);

    petDamageSelectElement.disabled = false;
  } else {
    const armorIgnoringDamagePet = document.createElement('option');
    armorIgnoringDamagePet.value = 'Armor-ignoring';
    armorIgnoringDamagePet.textContent = 'Armor-ignoring';
    petDamageSelectElement.appendChild(armorIgnoringDamagePet);

    petDamageSelectElement.disabled = true;
  }
}


function aptitudeConstraint(levelSelectElement, potencySelectElement, controlSelectElement, aptitudeDisplay) {
  const currentLevel = parseInt(levelSelectElement.value);
  let currentPotency = parseInt(potencySelectElement.value);
  let currentControl = parseInt(controlSelectElement.value);

  let maxControl = currentLevel - currentPotency;

  controlSelectElement.max = maxControl >= 0 ? maxControl : 0;
  if (currentControl > controlSelectElement.max) controlSelectElement.value = controlSelectElement.max;

  currentPotency = parseInt(potencySelectElement.value);
  currentControl = parseInt(controlSelectElement.value);

  let maxPotency = currentLevel - currentControl;

  potencySelectElement.max = maxPotency >= 0 ? maxPotency : 0;
  if (currentPotency > potencySelectElement.max) potencySelectElement.value = potencySelectElement.max;

  aptitudeDisplay.innerHTML = currentLevel - (parseInt(potencySelectElement.value) + parseInt(controlSelectElement.value));
}

function adjustNumericInput(inputEl, delta) {
  if (!inputEl) return;
  const min = inputEl.min !== undefined && inputEl.min !== '' ? parseInt(inputEl.min) : -Infinity;
  const max = inputEl.max !== undefined && inputEl.max !== '' ? parseInt(inputEl.max) : Infinity;
  const current = parseInt(inputEl.value) || 0;
  const next = Math.min(max, Math.max(min, current + delta));

  if (next !== current) {
    inputEl.value = next;
  }

  // Trigger existing change handlers to enforce constraints and downstream updates
  inputEl.dispatchEvent(new Event('change'));
}

function encodeUnicodeToBase64(obj) {
  const json = JSON.stringify(obj);
  const compressed = pako.gzip(json);
  const binary = String.fromCodePoint(...compressed);
  return btoa(binary);
}

globalThis.addEventListener('DOMContentLoaded', async () => {
  // read and init
  const myPaths = await readPaths();
  const myBranches = await readBranches();
  const myCommon = await readCommon();
  const myNames = await readNames();

  const characterNameSelectElement = document.getElementById("name_selection");
  const playerNameSelectElement = document.getElementById("player_name_selection");
  const nameGenerateButton = document.getElementById("name_generate_button");
  const nameFirstOnlyCheckbox = document.getElementById("name_first_only_checkbox");

  const levelSelectElement = document.getElementById("level_selection");
  const levelDecrementButton = document.getElementById("level_decrement");
  const levelIncrementButton = document.getElementById("level_increment");

  const pathSelectElement = document.getElementById("path_selection");
  const branchSelectElement = document.getElementById("branch_selection");

  const potencySelectElement = document.getElementById("potency_selection");
  const controlSelectElement = document.getElementById("control_selection");
  const potencyDecrementButton = document.getElementById("potency_decrement");
  const potencyIncrementButton = document.getElementById("potency_increment");
  const controlDecrementButton = document.getElementById("control_decrement");
  const controlIncrementButton = document.getElementById("control_increment");

  const aptitudeDisplay = document.getElementById("remaining_aptitude_display");

  const pathTechniqueSelectElement = document.getElementById("path_technique_selection_main");
  const branchTechniqueSelectElement = document.getElementById("branch_technique_selection_main");

  const pathPetDivElement = document.getElementById("path_pet_selection_main");
  const branchPetDivElement = document.getElementById("branch_pet_selection_main");

  const pathPetDamageTypeDivElement = document.getElementById("path_pet_damage_type_selection_main");
  const branchPetDamageTypeDivElement = document.getElementById("branch_pet_damage_type_selection_main");

  const skillSelectionContainer = document.getElementById("skill_selection_main");
  const skillSelectElement1 = document.getElementById("skill_selection_1");
  const skillSelectElement2 = document.getElementById("skill_selection_2");

  // populate paths and branches
  populateClass(pathSelectElement, myPaths);
  populateClass(branchSelectElement, myBranches);

  // populate armors
  const armorSelectElement = document.getElementById("armor_selection");
  populateArmor(armorSelectElement, myCommon);

  // populate skills
  populateSkill(skillSelectElement1, myCommon);
  populateSkill(skillSelectElement2, myCommon);

  // populate weapon set 1
  const mainWeapon1SelectElement = document.getElementById("main_hand_weapon_1");
  const offWeapon1SelectElement = document.getElementById("off_hand_weapon_1");

  populateWeapon(mainWeapon1SelectElement, myCommon, true);
  populateWeapon(offWeapon1SelectElement, myCommon, false);

  // populate weapon set 2

  const mainWeapon2SelectElement = document.getElementById("main_hand_weapon_2");
  const offWeapon2SelectElement = document.getElementById("off_hand_weapon_2");

  populateWeapon(mainWeapon2SelectElement, myCommon, true);
  populateWeapon(offWeapon2SelectElement, myCommon, false);

  // resistances
  const resistanceMajorMinorSelectElement = document.getElementById("major_or_3minors_selection");
  const resistanceContainer = document.getElementById("resistance_container");
  const majorResistanceSelectElement = document.getElementById("major_selection_1");
  const minor1ResistanceSelectElement = document.getElementById("minor_selection_1");
  const minor2ResistanceSelectElement = document.getElementById("minor_selection_2");
  const minor3ResistanceSelectElement = document.getElementById("minor_selection_3");

  // LOGIC

  // when level is changed
  levelSelectElement.addEventListener('change', () => {

    if (Number.parseInt(levelSelectElement.value) > 10) {
      levelSelectElement.value = 10;
    }
    if (Number.parseInt(levelSelectElement.value) < 1) {
      levelSelectElement.value = 1;
    }

    const currentLevel = Number.parseInt(levelSelectElement.value);

    // change amount of path and branch techniques
    setTechniqueCount(pathTechniqueSelectElement, currentLevel / 2 + 1, true);
    setTechniqueCount(branchTechniqueSelectElement, (currentLevel - 1) / 2 + 1, false);

    // change amount of potency and control
    aptitudeConstraint(levelSelectElement, potencySelectElement, controlSelectElement, aptitudeDisplay);

    // refresh techniques
    enforceExclusive(pathTechniqueSelectElement);
    enforceExclusive(branchTechniqueSelectElement);

    if (pathSelectElement.value !== "not_selected") {
      populateTechnique(pathTechniqueSelectElement, pathSelectElement.value, myPaths);
    }
    if (branchSelectElement.value !== "not_selected") {
      populateTechnique(branchTechniqueSelectElement, branchSelectElement.value, myBranches);
    }

    
  });

  potencySelectElement.addEventListener('change', () => aptitudeConstraint(levelSelectElement, potencySelectElement, controlSelectElement, aptitudeDisplay));

  controlSelectElement.addEventListener('change', () => aptitudeConstraint(levelSelectElement, potencySelectElement, controlSelectElement, aptitudeDisplay));

  // numeric controls (+/-)
  levelDecrementButton.addEventListener('click', () => adjustNumericInput(levelSelectElement, -1));
  levelIncrementButton.addEventListener('click', () => adjustNumericInput(levelSelectElement, 1));

  potencyDecrementButton.addEventListener('click', () => adjustNumericInput(potencySelectElement, -1));
  potencyIncrementButton.addEventListener('click', () => adjustNumericInput(potencySelectElement, 1));

  controlDecrementButton.addEventListener('click', () => adjustNumericInput(controlSelectElement, -1));
  controlIncrementButton.addEventListener('click', () => adjustNumericInput(controlSelectElement, 1));

  // name generator
  if (nameGenerateButton) {
    nameGenerateButton.addEventListener('click', () => {
      const firstNames = myNames?.Names?.First;
      const lastNames = myNames?.Names?.Last;

      if (!Array.isArray(firstNames) || !Array.isArray(lastNames) || firstNames.length === 0 || lastNames.length === 0) {
        return;
      }

      const first = firstNames[Math.floor(Math.random() * firstNames.length)];
      if (nameFirstOnlyCheckbox?.checked) {
        characterNameSelectElement.value = first;
        return;
      }

      const last = lastNames[Math.floor(Math.random() * lastNames.length)];
      characterNameSelectElement.value = `${first} ${last}`.trim();
    });
  }

  // skill constraint
  skillSelectionContainer.addEventListener('change', () => enforceExclusive(skillSelectionContainer));

  // populate path techniques once selected
  pathSelectElement.addEventListener('change', () => {
    const selected = pathSelectElement.value;

    if (selected != "not_selected") {
      populateTechnique(pathTechniqueSelectElement, selected, myPaths);
      pathTechniqueSelectElement.hidden = false;
    }
    else {
      pathTechniqueSelectElement.hidden = true;
    }

    populatePets(pathPetDivElement, selected, myPaths);
    populatePetDamageType(pathPetDamageTypeDivElement, '');
  });

  // populate branch techniques once selected
  branchSelectElement.addEventListener('change', () => {
    const selected = branchSelectElement.value;

    if (selected != "not_selected") {
      populateTechnique(branchTechniqueSelectElement, selected, myBranches);
      branchTechniqueSelectElement.hidden = false;
    }
    else {
      branchTechniqueSelectElement.hidden = true;
    }

    populatePets(branchPetDivElement, selected, myBranches);
    populatePetDamageType(branchPetDamageTypeDivElement, '');
  });

  // technique constraint

  pathTechniqueSelectElement.addEventListener('change', () => enforceExclusive(pathTechniqueSelectElement));
  branchTechniqueSelectElement.addEventListener('change', () => enforceExclusive(branchTechniqueSelectElement));

  // pet damage type constraint
  const pathPetSelector = pathPetDivElement.querySelector('select');
  pathPetSelector.addEventListener('change', () => {
    let selectedPathPetObj = myPaths[pathSelectElement.value].Pets.find(w => w.Name === pathPetSelector.value);
    populatePetDamageType(pathPetDamageTypeDivElement, selectedPathPetObj);

  });

  const branchPetSelector = branchPetDivElement.querySelector('select');
  branchPetSelector.addEventListener('change', () => {
    let selectedBranchPetObj = myBranches[branchSelectElement.value].Pets.find(w => w.Name === branchPetSelector.value);
    populatePetDamageType(branchPetDamageTypeDivElement, selectedBranchPetObj);

  });

  // resistance constraint
  resistanceMajorMinorSelectElement.addEventListener('change', () => {
    if (resistanceMajorMinorSelectElement.value == "1_major_1_minor") {
      majorResistanceSelectElement.value = "not_selected";
      majorResistanceSelectElement.parentElement.hidden = false;

      minor1ResistanceSelectElement.value = "not_selected";
      minor1ResistanceSelectElement.parentElement.hidden = false;

      minor2ResistanceSelectElement.value = "not_selected";
      minor2ResistanceSelectElement.parentElement.hidden = true;

      minor3ResistanceSelectElement.value = "not_selected";
      minor3ResistanceSelectElement.parentElement.hidden = true;
    }
    else {
      majorResistanceSelectElement.value = "not_selected";
      majorResistanceSelectElement.parentElement.hidden = true;

      minor1ResistanceSelectElement.value = "not_selected";
      minor1ResistanceSelectElement.parentElement.hidden = false;

      minor2ResistanceSelectElement.value = "not_selected";
      minor2ResistanceSelectElement.parentElement.hidden = false;

      minor3ResistanceSelectElement.value = "not_selected";
      minor3ResistanceSelectElement.parentElement.hidden = false;
    }

    enforceExclusive(resistanceContainer);

  });

  resistanceContainer.addEventListener('change', () => enforceExclusive(resistanceContainer));

  // weapon constraint
  mainWeapon1SelectElement.addEventListener('change', () => {
    weaponConstraint(mainWeapon1SelectElement, offWeapon1SelectElement, myCommon);
  });

  mainWeapon2SelectElement.addEventListener('change', () => {
    weaponConstraint(mainWeapon2SelectElement, offWeapon2SelectElement, myCommon);
  });

  document.getElementById("submit_button").addEventListener("click", async () => {
    // get techniques
    
    // get values
    const myPath = pathSelectElement.value;
    const myBranch = branchSelectElement.value;

    // get resistances
    const myMajor = majorResistanceSelectElement.value;
    const myMinors = [
      minor1ResistanceSelectElement.value,
      minor2ResistanceSelectElement.value,
      minor3ResistanceSelectElement.value,
    ];

    // get skills
    const mySkills = [
      skillSelectElement1.value,
      skillSelectElement2.value
    ].filter(v => v !== "not_selected");

    // Gather all chosen techniques (ignore “not_selected”)
    const pathTechniqueSelectors = Array.from(
      pathTechniqueSelectElement.querySelectorAll('select[id*="_selection_"]')
    );

    const myPathTechniques = pathTechniqueSelectors
      .map(s => s.value)
      .filter(v => v !== "not_selected");

    const branchTechniqueSelectors = Array.from(
      branchTechniqueSelectElement.querySelectorAll('select[id*="_selection_"]')
    );
    
    const myBranchTechniques = branchTechniqueSelectors
      .map(s => s.value)
      .filter(v => v !== "not_selected");

    // Gather pet information
    const chosenPathPet = pathPetSelector.value;
    const chosenPathPetDamageType = pathPetDamageTypeDivElement.querySelector('select').value;

    let pathPetString = "";

    if (chosenPathPet && chosenPathPet !== "not_selected") {
      pathPetString = chosenPathPet + " pet (" + chosenPathPetDamageType.toLowerCase() + ")"
    }

    const chosenBranchPet = branchPetSelector.value;
    const chosenBranchPetDamageType = branchPetDamageTypeDivElement.querySelector('select').value;

    let branchPetString = "";

    if (chosenBranchPet && chosenBranchPet !== "not_selected") {
      branchPetString = chosenBranchPet + " pet (" + chosenBranchPetDamageType.toLowerCase() + ")"
    }

    // gather selected weapons into an order-agnostic array
    const weaponSelections = [
      mainWeapon1SelectElement.value,
      offWeapon1SelectElement.value,
      mainWeapon2SelectElement.value,
      offWeapon2SelectElement.value
    ].filter(v => v && v !== "not_selected");

    // armor
    const myArmor = armorSelectElement.value;

    // send character data
    const characterData = {
      name: characterNameSelectElement.value,
      playerName: playerNameSelectElement.value,
      path: myPath,
      branch: myBranch,
      level: Number.parseInt(levelSelectElement.value),
      potency: potencySelectElement.value,
      control: controlSelectElement.value,
      skills: mySkills,
      majorResistance: myMajor,
      minorResistances: myMinors,
      armor: myArmor,
      weapons: weaponSelections,
      pathTechniques: myPathTechniques,
      branchTechniques: myBranchTechniques,
      pathPet: pathPetString,
      branchPet: branchPetString
    };

    // Serialize and encode the data
    const base64String = encodeUnicodeToBase64(characterData);

    // Construct the shareable URL
    const shareableURL = `output.html?q=${encodeURIComponent(base64String)}`;

    // Redirect to the shareable URL
    globalThis.location.href = shareableURL;
  })
});
