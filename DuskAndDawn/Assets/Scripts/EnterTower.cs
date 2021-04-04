using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.Linq;
using Yarn.Unity;

using UnityEngine.SceneManagement;

public class EnterTower : MonoBehaviour
{
    Metadata metadata;

    public int dawnGemsPickedUp = 0, duskGemsPickedUp = 0;
    public int dawnRequiredGems = 3, duskRequiredGems = 3;
    List<PlayerEnterTowerCheck> children = new List<PlayerEnterTowerCheck>();

    VariableStorageBehaviour _varStorage;
    // The dialogue runner that we want to attach the 'doneTreeQuest' function to
#pragma warning disable 0649
    [SerializeField] Yarn.Unity.DialogueRunner dialogueRunner;

    bool _enteredTower = false;
    // Start is called before the first frame update
    void Start()
    {
        metadata = GameObject.Find("Metadata").GetComponent<Metadata>();
        

        _varStorage = GameObject.FindObjectOfType<VariableStorageBehaviour>().GetComponent<VariableStorageBehaviour>();
        foreach (Transform child in transform)
        {
            children.Add(child.gameObject.GetComponent<PlayerEnterTowerCheck>());
            print(child.gameObject.name);
        }
        
        // Register a function on startup called 'canEnterTower' that lets Yarn
        // scripts query to see if the tree quest is complete.
        dialogueRunner.AddFunction("canEnterTower", 0, delegate (Yarn.Value[] parameters)
        {
            return dawnGemsPickedUp >= dawnRequiredGems && duskGemsPickedUp >= duskRequiredGems;
        });

        dialogueRunner.AddFunction("duskAndDawnInPosition", 0, delegate (Yarn.Value[] parameters)
        {
            return children.All(child => child.enteringTower);
        });
    }

    void Update()
    {
        dawnGemsPickedUp = metadata.dawnGemsPickedUp;
        duskGemsPickedUp = metadata.duskGemsPickedUp;
        if (_varStorage.GetValue("$entered_tower").AsBool == true)
        {
            SceneManager.LoadScene(sceneName: "IceSlidingPuzzle");
        }
    }
}
