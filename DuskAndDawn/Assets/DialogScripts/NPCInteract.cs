using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class NPCInteract : MonoBehaviour
{
	public bool isInDialog = false;

    public GameObject InteractTriggerUI;
    public ItemDropHandler[] handlers;
    public Metadata info;

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
        if (gameObject.Equals(info.getCurPlayer()))
        {
            gameObject.transform.GetComponent<ThreeDMovement>().enabled = true;
        }
    }

    public void Interact()
    {
        // Check if NPC is active and not already talking
        if(NPC.ActiveNPC && !isInDialog)
        {
            InteractTriggerUI.SetActive(false);
            // Start dialog
            isInDialog = true;
            gameObject.transform.GetComponent<ThreeDMovement>().enabled = false;
            DialogUI.Instance.dialogueRunner.StartDialogue(NPC.ActiveNPC.YarnStartNode);
        }
    }
}
