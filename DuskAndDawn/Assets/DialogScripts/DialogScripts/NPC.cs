using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using TMPro;
using Yarn.Unity;
using System;
using Cinemachine;

public class NPC : MonoBehaviour
{
    public static NPC ActiveNPC { get; private set; }
    public string YarnStartNode { get { return yarnStartNode; } }
    public string Name { get { return npc_name; } }

    public static List<string> programNames = new List<string>();

#pragma warning disable 0649
    [SerializeField] string yarnStartNode = "Start";
    [SerializeField] YarnProgram yarnDialog;
    // [SerializeField] SpeakerData speakerData;
#pragma warning restore 0649

    public GameObject InteractTriggerUI;
    public GameObject textObj;
    public string text;
    public string npc_name;

    private Metadata _metadata;
    bool addedQuest = false;

    // Each quest will manipulate this value.
    // Ex: Tree quest.cs sets this to true if player accepted tree quest
    public bool activatedQuest;
    public ItemClickHandler[] handlers;
    private void Start()
    {
        _metadata = GameObject.FindObjectOfType<Metadata>().GetComponent<Metadata>();
        
        InteractTriggerUI.SetActive(false);
    }

    private void OnTriggerEnter(Collider collision)
    {
        if (!programNames.Contains(yarnDialog.name))
        {
            programNames.Add(yarnDialog.name);
            GameObject.FindObjectOfType<DialogUI>().dialogueRunner.Add(yarnDialog);
        }
        if (collision.CompareTag("Player") && collision.gameObject.name == gameObject.tag && _metadata.getCurPlayer().name == collision.gameObject.name)
        {
            GetComponent<AudioSource>().Play();
            SetActiveNPC(true);
            textObj.GetComponent<TextMeshProUGUI>().SetText(text);
            InteractTriggerUI.SetActive(true);
            /*Debug.Log("Before initial");
            if (activatedQuest)
            {
                Debug.Log("Active");
                foreach (ItemClickHandler handler in handlers)
                {
                    handler.active = true;
                }
            }*/
        }
    }

    private void OnTriggerStay(Collider collision)
    {
        if (collision.CompareTag("Player") && collision.gameObject.name == gameObject.tag && _metadata.getCurPlayer().name == collision.gameObject.name)
        {
            print(collision.gameObject.name);
            SetActiveNPC(true);
            /*            textObj.GetComponent<TextMeshProUGUI>().SetText(text);
                        InteractTriggerUI.SetActive(true);*/
/*            if (activatedQuest)
            {
                foreach (ItemClickHandler handler in handlers)
                {
                    handler.active = true;
                }
            }*/
        } 
    }

    private void OnTriggerExit(Collider collision)
    {
        if (collision.CompareTag("Player") && collision.gameObject.name == gameObject.tag && _metadata.getCurPlayer().name == collision.gameObject.name)
        {
            SetActiveNPC(false);
            textObj.GetComponent<TextMeshProUGUI>().SetText("");
            InteractTriggerUI.SetActive(false);

/*            if (activatedQuest)
            {
                foreach (ItemClickHandler handler in handlers)
                {
                    handler.active = false;
                }
            }*/
        }
    }

    public void deactivateNPC()
    {
        SetActiveNPC(false);
        textObj.GetComponent<TextMeshProUGUI>().SetText("");
        InteractTriggerUI.SetActive(false);
    }

    public void SetActiveNPC(bool set)
    {
        ActiveNPC = set ? this : null;
    }
}
