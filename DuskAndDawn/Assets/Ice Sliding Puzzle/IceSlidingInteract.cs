using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Yarn.Unity;

public class IceSlidingInteract : MonoBehaviour
{
    public bool isInDialog = false;

    public GameObject InteractTriggerUI;
    public ItemDropHandler[] handlers;
    public IceSlideMetadata info;

    DialogUI dialogUI;

    private void Awake()
    {
        dialogUI = GameObject.FindObjectOfType<DialogUI>();
    }

    // Update is called once per frame
    void Update()
    {
        // If in dialog - early out
        if (isInDialog) return;

        // Check input
        if (Input.GetKeyDown(KeyCode.F))
        {
            Interact();
        }

        
    }

    public void OnDialogEnd()
    {
        isInDialog = false;
        if (gameObject.Equals(info.curPlayer))
        {
            gameObject.transform.GetComponent<PlayerController>().enabled = true;
        }
    }

    public void Interact()
    {
        // Check if NPC is active and not already talking
        if (IceSlidingNPC.ActiveNPC && !isInDialog)
        {
            InteractTriggerUI.SetActive(false);
            // Start dialog
            isInDialog = true;
            gameObject.GetComponent<PlayerController>().enabled = false;
            dialogUI.dialogueRunner.StartDialogue(IceSlidingNPC.ActiveNPC.YarnStartNode);
        }
    }


    //Overload Interact with other start node
    public void Interact(string yarnStartNode)
    {
        // Check if not already talking (Dont need to be in range of npc)
        if (!isInDialog)
        {
            InteractTriggerUI.SetActive(false);
            // Start dialog
            isInDialog = true;
            gameObject.transform.GetComponent<PlayerController>().enabled = false;
            dialogUI.dialogueRunner.StartDialogue(yarnStartNode);
        }
    }
}
