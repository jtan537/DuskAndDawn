using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using TMPro;
using System;
public class IceSlidingNPC : MonoBehaviour
{
    public static IceSlidingNPC ActiveNPC { get; private set; }
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

    private IceSlideMetadata _metadata;

    // Each quest will manipulate this value.
    // Ex: Tree quest.cs sets this to true if player accepted tree quest
    public bool activatedQuest;
    public ItemClickHandler[] handlers;

    bool enteredTrigger = false;
    private void Awake()
    {
        _metadata = GameObject.FindObjectOfType<IceSlideMetadata>().GetComponent<IceSlideMetadata>();
        try
        {
            GameObject.FindObjectOfType<DialogUI>().dialogueRunner.Add(yarnDialog);
        }
        catch (Exception e)
        {
            print("Readding Yarn dialog: " + yarnDialog.name);
        }

        InteractTriggerUI.SetActive(false);
    }

    private void OnTriggerStay(Collider collision)
    {
        if (collision.CompareTag("Player") && collision.gameObject.name == gameObject.tag && _metadata.curPlayer.name == collision.gameObject.name
            && !GameObject.Find(gameObject.tag).GetComponent<PlayerController>().isSliding)
        {
            if (!enteredTrigger)
            {
                GetComponent<AudioSource>().Play();
                enteredTrigger = true;
                InteractTriggerUI.SetActive(true);
                SetActiveNPC(true);
            }
            
            print(collision.gameObject.name);
            textObj.GetComponent<TextMeshProUGUI>().SetText(text);
            
            if (activatedQuest)
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
        if (collision.CompareTag("Player") && collision.gameObject.name == gameObject.tag && _metadata.curPlayer.name == collision.gameObject.name)
        {
            enteredTrigger = false;
            SetActiveNPC(false);
            textObj.GetComponent<TextMeshProUGUI>().SetText("");
            InteractTriggerUI.SetActive(false);

            if (activatedQuest)
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

    public void SetActiveNPC(bool set)
    {
        ActiveNPC = set ? this : null;
    }
}