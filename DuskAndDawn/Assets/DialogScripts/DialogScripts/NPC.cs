using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using TMPro;
using Yarn.Unity;
using System;

public class NPC : MonoBehaviour
{
    public static NPC ActiveNPC { get; private set; }
    public string YarnStartNode { get { return yarnStartNode; } }
    public string Name { get { return npc_name; } }

#pragma warning disable 0649
    [SerializeField] string yarnStartNode = "Start";
    [SerializeField] YarnProgram yarnDialog;

#pragma warning restore 0649

    public GameObject InteractTriggerUI;
    public GameObject textObj;
    public string text;
    public string npc_name;

    private Metadata _metadata;

    VariableStorageBehaviour _varStorage;
    public bool _initiatedDialog;
    public ItemClickHandler[] handlers;

    private void Start()
    {
        _metadata = GameObject.FindObjectOfType<Metadata>().GetComponent<Metadata>();
        try
        {
            DialogUI.Instance.dialogueRunner.Add(yarnDialog);
        } catch (Exception e)
        {
            print("Readding Yarn dialog: " + yarnDialog.name);
        }
        
        InteractTriggerUI.SetActive(false);

        _varStorage = GameObject.FindObjectOfType<VariableStorageBehaviour>().GetComponent<VariableStorageBehaviour>();
    }

    private void Update()
    {
        _initiatedDialog = _varStorage.GetValue("$quest_activated").AsBool;
    }

    private void OnTriggerEnter(Collider collision)
    {
        if (collision.CompareTag("Player") && collision.gameObject.name == gameObject.tag && _metadata.getCurPlayer().name == collision.gameObject.name)
        {
            GetComponent<AudioSource>().Play();
            SetActiveNPC(true);
            textObj.GetComponent<TextMeshProUGUI>().SetText(text);
            InteractTriggerUI.SetActive(true);
            Debug.Log("Before initial");
            if (_initiatedDialog)
            {
                Debug.Log("Active");
                foreach (ItemClickHandler handler in handlers)
                {
                    handler.active = true;
                }
            }
        }
    }

    private void OnTriggerStay(Collider collision)
    {
        if (collision.CompareTag("Player") && collision.gameObject.name == gameObject.tag && _metadata.getCurPlayer().name == collision.gameObject.name)
        {
            SetActiveNPC(true);
            /*            textObj.GetComponent<TextMeshProUGUI>().SetText(text);
                        InteractTriggerUI.SetActive(true);*/
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
        if (collision.CompareTag("Player") && collision.gameObject.name == gameObject.tag && _metadata.getCurPlayer().name == collision.gameObject.name)
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

    public void deactivateNPC()
    {
        SetActiveNPC(false);
        textObj.GetComponent<TextMeshProUGUI>().SetText("");
        InteractTriggerUI.SetActive(false);
    }

    void SetActiveNPC(bool set)
    {
        ActiveNPC = set ? this : null;
    }
}
