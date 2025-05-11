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

  selectElement.innerHTML = '<option value="not_selected">Not selected</option>';

  commonData["Armors"].forEach(armorObject => {
    const opt = document.createElement('option');
    opt.value = armorObject["Name"];
    opt.textContent = armorObject["Name"];
    selectElement.appendChild(opt);
  });
  return true;
}

function populateWeapon(selectElement, commonData, isMainHand) {
  if (!commonData) {
    selectElement.innerHTML = '<option value="">An error has occurred.</option>';
    return false;
  }

  selectElement.innerHTML = '<option value="not_selected">Not selected</option><hr>';

  commonData["Weapons"].forEach(weaponObject => {
    if (
      weaponObject["Name"] != "HORIZONTAL_RULE" &&
      ((isMainHand && weaponObject["Type"] != "off_hand") || 
      (!isMainHand && weaponObject["Type"] == "off_hand") ||
      (!isMainHand && weaponObject["isLight"] == true))
    ) {
        const opt = document.createElement('option');
        opt.value = weaponObject["Name"];
        opt.textContent = weaponObject["Name"];
        selectElement.appendChild(opt);
    }
    
    if (weaponObject["Name"] == "HORIZONTAL_RULE") {
        const hr = document.createElement('hr');
        selectElement.appendChild(hr);
    }
  });
  return true;
}

function weaponConstraint(selectElement, offhandElement, commonData) {
  const selected = selectElement.value;

  if (selected == "not_selected") {
    return true;
  }
  
  const result = commonData["Weapons"].find(item => item.Name === selected);

  if (result["Type"] == "two_hand") {
    offhandElement.hidden = true;
  }
  else {
    offhandElement.hidden = false;
    offhandElement.value = "not_selected";
  }


}

function enforceExclusive(container) {
  const selects = Array.from(
    container.querySelectorAll('select[id*="_selection_"]')
  );
  // Gather all chosen techniques (ignore “not_selected”)
  const chosen = selects
    .map(s => s.value)
    .filter(v => v !== "not_selected");

  selects.forEach(s => {
    Array.from(s.options).forEach(opt => {
      if (opt.value === "not_selected") return;
      // Disable if it’s chosen somewhere else
      opt.disabled = chosen.includes(opt.value) && s.value !== opt.value;
    });
  });
}

function populateTechnique(selectedElement, selectedClass, classData) {

  selectedElement.querySelectorAll('select[id*="_technique_selection_"]').forEach(select => {

      select.innerHTML = '<option value="not_selected">Not selected</option>';

      classData[selectedClass]["Techniques"].forEach(techniqueName => {
          const opt = document.createElement('option');
          opt.value = techniqueName;
          opt.textContent = techniqueName;
          select.appendChild(opt);
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

    optionClones.forEach(opt => sel.appendChild(opt.cloneNode(true)));
    container.appendChild(sel);
  }
}

function aptitudeConstraint(levelSelectElement, potencySelectElement, controlSelectElement) {
    const currentLevel = parseInt(levelSelectElement.value);
    let currentPotency = parseInt(potencySelectElement.value);
    let currentControl = parseInt(controlSelectElement.value);

    maxControl = currentLevel - currentPotency;

    controlSelectElement.max = maxControl >= 0? maxControl : 0;
    if (currentControl > controlSelectElement.max) controlSelectElement.value = controlSelectElement.max;
    
    currentPotency = parseInt(potencySelectElement.value);
    currentControl = parseInt(controlSelectElement.value);

    maxPotency = currentLevel - currentControl;

    potencySelectElement.max = maxPotency >= 0? maxPotency : 0;
    if (currentPotency > potencySelectElement.max) potencySelectElement.value = potencySelectElement.max;
}

document.addEventListener('DOMContentLoaded', async () => {
  // read and init
  const myPaths = await readPaths();
  const myBranches = await readBranches();
  const myCommon = await readCommon();

  const levelSelectElement = document.getElementById("level_selection");

  const pathSelectElement = document.getElementById("path_selection");
  const branchSelectElement = document.getElementById("branch_selection");

  const potencySelectElement = document.getElementById("potency_selection");
  const controlSelectElement = document.getElementById("control_selection");

  const pathTechniqueSelectElement = document.getElementById("path_technique_selection_main");
  const branchTechniqueSelectElement = document.getElementById("branch_technique_selection_main");

  // populate paths and branches
  const isPathPopulated = populateClass(pathSelectElement, myPaths);
  const isBranchPopulated = populateClass(branchSelectElement, myBranches);

  // populate armors
  const armorSelectElement = document.getElementById("armor_selection");
  const isArmorPopulated = populateArmor(armorSelectElement, myCommon);

  // populate weapon set 1
  const mainWeapon1SelectElement = document.getElementById("main_hand_weapon_1");
  const offWeapon1SelectElement = document.getElementById("off_hand_weapon_1");

  const isMainWeapon1Populated = populateWeapon(mainWeapon1SelectElement, myCommon, true);
  const isOffWeapon1Populated = populateWeapon(offWeapon1SelectElement, myCommon, false);

  // populate weapon set 2

  const mainWeapon2SelectElement = document.getElementById("main_hand_weapon_2");
  const offWeapon2SelectElement = document.getElementById("off_hand_weapon_2");

  const isMainWeapon2Populated = populateWeapon(mainWeapon2SelectElement, myCommon, true);
  const isOffWeapon2Populated = populateWeapon(offWeapon2SelectElement, myCommon, false);

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
    const currentLevel = parseInt(levelSelectElement.value);
    
    // change amount of path and branch techniques
    setTechniqueCount(pathTechniqueSelectElement, currentLevel/2+1, true);
    setTechniqueCount(branchTechniqueSelectElement, (currentLevel-1)/2+1, false);

    // change amount of potency and control
    aptitudeConstraint(levelSelectElement, potencySelectElement, controlSelectElement);

    // refresh techniques
    enforceExclusive(pathTechniqueSelectElement)
    enforceExclusive(branchTechniqueSelectElement)
  });

  potencySelectElement.addEventListener('change',  () => aptitudeConstraint(levelSelectElement, potencySelectElement, controlSelectElement));

  controlSelectElement.addEventListener('change',  () => aptitudeConstraint(levelSelectElement, potencySelectElement, controlSelectElement));

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
  });

  // technique constraint

  pathTechniqueSelectElement.addEventListener('change', () => enforceExclusive(pathTechniqueSelectElement));
  branchTechniqueSelectElement.addEventListener('change', () => enforceExclusive(branchTechniqueSelectElement));

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

    enforceExclusive(resistanceContainer)

  });
  
  resistanceContainer.addEventListener('change', () => enforceExclusive(resistanceContainer));

  // weapon constraint
  mainWeapon1SelectElement.addEventListener('change', () => {
    weaponConstraint(mainWeapon1SelectElement, offWeapon1SelectElement, myCommon);
  });

  mainWeapon2SelectElement.addEventListener('change', () => {
    weaponConstraint(mainWeapon2SelectElement, offWeapon2SelectElement, myCommon);
  });
});