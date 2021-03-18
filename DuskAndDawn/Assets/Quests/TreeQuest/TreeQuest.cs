using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Yarn.Unity;

public class TreeQuest : MonoBehaviour
{
    
    public int numRequiredSuns;
    VariableStorageBehaviour _varStorage;
    [SerializeField]
    NPC _treeNPC;
    // The dialogue runner that we want to attach the 'doneTreeQuest' function to
#pragma warning disable 0649
    [SerializeField] Yarn.Unity.DialogueRunner dialogueRunner;
#pragma warning restore 0649

    private void Start()
    {
        _varStorage = GameObject.FindObjectOfType<VariableStorageBehaviour>().GetComponent<VariableStorageBehaviour>();
        // Register a function on startup called 'doneTreeQuest' that lets Yarn
        // scripts query to see if the tree quest is complete.
        dialogueRunner.AddFunction("doneTreeQuest", 0, delegate (Yarn.Value[] parameters)
        {
            return numRequiredSuns <= 0;
        });
    }

    private void Update()
    {
        if(_varStorage.GetValue("$tree_quest_activated").AsBool == true)
        {
            _treeNPC.activatedQuest = true;
        }
    }
}
