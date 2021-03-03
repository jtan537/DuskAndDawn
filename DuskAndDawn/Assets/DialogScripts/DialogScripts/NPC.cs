using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using TMPro;
using Yarn.Unity;

public class NPC : MonoBehaviour
{
    public static NPC ActiveNPC { get; private set; }
    public string YarnStartNode { get { return yarnStartNode; } }
    public string NPCName { get { return npc_name; } }

#pragma warning disable 0649
    [SerializeField] string yarnStartNode = "Start";
    [SerializeField] YarnProgram yarnDialog;
#pragma warning restore 0649

    public GameObject InteractTriggerUI;
    public GameObject textObj;
    public string text;
    public string npc_name;

    VariableStorageBehaviour _varStorage;
    bool _initiatedDialog;
    public ItemClickHandler[] handlers;

    void Start()
    {
        DialogUI.Instance.dialogueRunner.Add(yarnDialog);
        InteractTriggerUI.SetActive(false);
        _varStorage = GameObject.FindObjectOfType<VariableStorageBehaviour>().GetComponent<VariableStorageBehaviour>();
    }

    void Update()
    {
        _initiatedDialog = _varStorage.GetValue("$quest_activated").AsBool;
    }

    private void OnTriggerEnter(Collider collision)
    {
        if(collision.CompareTag("Player"))
        {
            SetActiveNPC(true);
            textObj.GetComponent<TextMeshProUGUI>().SetText(text);
            InteractTriggerUI.SetActive(true);

            if (_initiatedDialog)
            {
                foreach (ItemClickHandler handler in handlers)
                {
                    handler.active = true;
                }
            }
        }
    }

    private void OnTriggerExit(Collider collision)
    {
        if(collision.CompareTag("Player"))
        {
            SetActiveNPC(false);
            textObj.GetComponent<TextMeshProUGUI>().SetText("");
            InteractTriggerUI.SetActive(false);

            if (_initiatedDialog)
            {
                foreach (ItemClickHandler handler in handlers)
                {
                    handler.active = false;
                }
            }
        }
    }

    void SetActiveNPC(bool set)
    {
        ActiveNPC = set ? this : null;
    }
}
