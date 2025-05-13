function decodeBase64ToUnicode(base64) {
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    const decompressed = pako.ungzip(bytes, { to: 'string' });
    return JSON.parse(decompressed);
}

function printWeapons(mainW, offW) {
    return offW != "not_selected" ? mainW + " | " + offW : mainW;
}

function printTechniques(techniqueArray) {
    let result = "";

    techniqueArray.forEach(element => {
        result += '<tr><td colspan="4">Technique: ' + element + '</td></tr>';
    });

    return result
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

    

    // resistances
    document.getElementById('characterParry').innerHTML = "<b>Parry:</b> " + characterData.resistances.Parry;
    document.getElementById('characterWarding').innerHTML = "<b>Warding:</b> " + characterData.resistances.Warding;
    document.getElementById('characterConstitution').innerHTML = "<b>Constitution:</b> " + characterData.resistances.Constitution;
    document.getElementById('characterEvasion').innerHTML = "<b>Evasion:</b> " + characterData.resistances.Evasion;

    // weapons
    document.getElementById('characterWeapons1').innerHTML = printWeapons(characterData.mainWeapon1, characterData.offWeapon1);
    document.getElementById('characterWeapons2').innerHTML = printWeapons(characterData.mainWeapon2, characterData.offWeapon2);
    
    // techniques
    document.getElementById('characterPathTechniques').innerHTML = printTechniques(characterData.pathTechniques);
    document.getElementById('characterBranchTechniques').innerHTML = printTechniques(characterData.branchTechniques);
}

window.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const base64String = params.get('q');

  document.getElementById("copyButton").addEventListener("click", () => {
    navigator.clipboard.writeText("https://sigil-create.tyghsh.cc/output.html?q=" + base64String)
      .then(() => alert("Copied the share link."))
      .catch(err => alert("Failed to copy the share link."));
  });

    if (base64String) {
        try {
            const jsonString = decodeBase64ToUnicode(base64String);
            const characterData = JSON.parse(jsonString);

            displayCharacter(characterData)

        } catch (error) {
            console.error('Error decoding character data:', error);
            // Handle error (e.g., display a message to the user)
        }
    } else {
        // Handle case where 'q' parameter is missing
        window.location.href = "index.html";
    }
});