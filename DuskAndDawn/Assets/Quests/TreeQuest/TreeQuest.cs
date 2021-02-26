using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Yarn.Unity;

public class TreeQuest : MonoBehaviour
{
    
    public int numRequiredSuns;

    // The dialogue runner that we want to attach the 'doneTreeQuest' function to
#pragma warning disable 0649
    [SerializeField] Yarn.Unity.DialogueRunner dialogueRunner;
#pragma warning restore 0649

    private void Start()
    {
        // Register a function on startup called 'doneTreeQuest' that lets Yarn
        // scripts query to see if the tree quest is complete.
        dialogueRunner.AddFunction("doneTreeQuest", 0, delegate (Yarn.Value[] parameters)
        {
            return numRequiredSuns == 0;
        });
    }
}
