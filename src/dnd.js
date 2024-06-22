import React, { useState, useCallback } from "react";
import {
  apiUrl,
  ATTRIBUTE_LIST,
  CLASS_LIST,
  SKILL_LIST,
  initialAttributeValue,
  initialSkillValue,
} from "./consts";
import { getModifier } from "./helper";
import useAttributes from "./hooks/useAttributes";
import useSkills from "./hooks/useSkills";

function Dnd({ initialAttributes, initialSkills }) {
  const [rolledNumber, setRolledNumber] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState(SKILL_LIST[0].name);
  const [dc, setDc] = useState(null);
  const [characterCount, setCharacterCount] = useState(1); 

  const [modifiers, setModifiers] = useState(
    ATTRIBUTE_LIST.reduce(
      (accumulator, attribute) => ({
        ...accumulator,
        [attribute]: getModifier(
          initialAttributes[attribute] || initialAttributeValue
        ),
      }),
      {}
    )
  );

  const { attributes, increaseAttribute, decreaseAttribute } = useAttributes(
    initialAttributes ||
      ATTRIBUTE_LIST.reduce(
        (accumulator, attribute) => ({
          ...accumulator,
          [attribute]: initialAttributeValue,
        }),
        {}
      ),
    modifiers,
    setModifiers
  );

  const {
    skills,
    allowedSkillPoints,
    usedSkillPoints,
    increaseSkill,
    decreaseSkill,
  } = useSkills(
    initialSkills ||
      SKILL_LIST.reduce(
        (accumulator, skill) => ({
          ...accumulator,
          [skill.name]: initialSkillValue,
        }),
        {}
      ),
    modifiers
  );

  const [displayRequirements, setDisplayRequirements] = useState(null);

  const hideRequirements = useCallback(() => {
    setDisplayRequirements(null);
  }, []);

  const meetsClassRequirements = useCallback(
    (roleClass) => {
      const doesNotMeetRequirement = Object.keys(CLASS_LIST[roleClass]).find(
        (attribute) => attributes[attribute] < CLASS_LIST[roleClass][attribute]
      );
      return !doesNotMeetRequirement;
    },
    [attributes]
  );

  const generateRandomNumber = useCallback(() => {
    const randomNumber = Math.floor(Math.random() * 20) + 1;
    setRolledNumber(randomNumber);
  }, []);

  const getNumberToBeat = useCallback(() => {
    return (
      skills[selectedSkill] +
      modifiers[
        SKILL_LIST.find((skill) => skill.name === selectedSkill)
          .attributeModifier
      ] +
      rolledNumber
    );
  }, [skills, selectedSkill, modifiers, rolledNumber]);

  const save = useCallback(() => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", apiUrl, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    var data = JSON.stringify({ attributes, skills });
    xhr.send(data);
  }, [attributes, skills]);

  const addNewCharacter = () => {
    setCharacterCount((prevCount) => prevCount + 1);
  };

  const resetAllCharacters = () => {
    // Reset attributes
    const resetAttributes = ATTRIBUTE_LIST.reduce((accumulator, attribute) => {
      accumulator[attribute] = initialAttributeValue;
      return accumulator;
    }, {});

    // Reset skills
    const resetSkills = SKILL_LIST.reduce((accumulator, skill) => {
      accumulator[skill.name] = initialSkillValue;
      return accumulator;
    }, {});

    // Reset modifiers (if needed)
    const resetModifiers = ATTRIBUTE_LIST.reduce((accumulator, attribute) => {
      accumulator[attribute] = getModifier(initialAttributeValue);
      return accumulator;
    }, {});

    // Update states
    setModifiers(resetModifiers);
    attributes(resetAttributes);
    skills(resetSkills);
  };

  return (
    <>
      <section className="App-section">
        <div className="button-container">
          <button className="button" onClick={addNewCharacter}>
            Add New Character
          </button>
          <button className="button" onClick={resetAllCharacters}>
            Reset All Characters
          </button>
          <button className="button" onClick={save}>
            Save All Characters
          </button>
        </div>
        <h2>Skill Check Results</h2>
        <div>
          Skill:
          <select onChange={(e) => setSelectedSkill(e.target.value)}>
            {SKILL_LIST.map((skill) => (
              <option key={skill.name}>{skill.name}</option>
            ))}
          </select>
        </div>
        <div>
          DC:
          <input type="number" onChange={(e) => setDc(e.target.value)} />
        </div>
        <div>
          <button onClick={generateRandomNumber}>Roll</button>
          <span>{rolledNumber}</span>
        </div>
        <div>
          total:
          <span>{getNumberToBeat()}</span>
        </div>
        <div>{getNumberToBeat() >= dc ? "Successful" : "Failure"}</div>
      </section>

      {/* Render character sections dynamically */}
      {[...Array(characterCount)].map((_, index) => (
        <div key={index}>
          <h2>Character: {index + 1}</h2>
          <h3>Skill Check</h3>
          <div className="flex row pt-1" style={{ justifyContent: "center" }}>
            <div className="border border-radius-1 pa-1 ml-1">
              <h2>Attributes</h2>
              {Object.keys(attributes).map((attribute) => (
                <div key={attribute}>
                  {attribute}: {attributes[attribute]} (Modifier:{" "}
                  {modifiers[attribute]})
                  <button
                    onClick={() => increaseAttribute(attribute)}
                    className="ml-1"
                  >
                    +
                  </button>
                  <button
                    onClick={() => decreaseAttribute(attribute)}
                    className="ml-1"
                  >
                    -
                  </button>
                </div>
              ))}
            </div>
            <div className="border border-radius-1 pa-1 ml-1">
              <h2>Classes</h2>
              {Object.keys(CLASS_LIST).map((roleClass) => (
                <div
                  key={roleClass}
                  className={`${
                    meetsClassRequirements(roleClass) && "red"
                  } cursor-pointer`}
                  onClick={() => setDisplayRequirements(roleClass)}
                >
                  {roleClass}
                </div>
              ))}
            </div>
            {displayRequirements && (
              <div className="border border-radius-1 pa-1 ml-1">
                <h2>{displayRequirements} Minimum Requirements</h2>
                {Object.keys(CLASS_LIST[displayRequirements]).map((attribute) => (
                  <div key={attribute}>
                    {attribute}: {CLASS_LIST[displayRequirements][attribute]}
                  </div>
                ))}
                <button onClick={hideRequirements} className="mt-1">
                  Close Requirement View
                </button>
              </div>
            )}
            <div className="border border-radius-3 pa-1 ml-1">
              <h2>Skills</h2>
              <h3>
                Total skill points (used/total): {usedSkillPoints}/
                {allowedSkillPoints}
              </h3>
              {SKILL_LIST.map((skill) => (
                <div key={skill.name}>
                  {skill.name}: {skills[skill.name]}
                  (Modifier: {skill.attributeModifier}):&nbsp;
                  {modifiers[skill.attributeModifier]}
                  <button
                    onClick={() => increaseSkill(skill.name)}
                    className="ml-1"
                  >
                    +
                  </button>
                  <button
                    onClick={() => decreaseSkill(skill.name)}
                    className="ml-1"
                  >
                    -
                  </button>
                  total:&nbsp;
                  {skills[skill.name] + modifiers[skill.attributeModifier]}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

export default Dnd;
