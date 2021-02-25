using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class NPCInteract : MonoBehaviour
{
	bool isInDialog = false;

    public GameObject InteractTriggerUI;
    public ItemDropHandler[] handlers;

    // Update is called once per frame
    void Update()
    {
        // If in dialog - early out
        if (isInDialog) return;

        Interact();
    }

    public void OnDialogEnd()
    {
        isInDialog = false;
        gameObject.transform.GetComponent<ThirdPersonMovement>().enabled = true;
        if (NPC.ActiveNPC.Name == "Tree")
        {
            foreach (ItemDropHandler handler in handlers)
            {
                handler.active = true;
            }
        }
    }

    void Interact()
    {
        // Check input
        if (Input.GetKeyDown(KeyCode.F))
        {
            // Check if NPC is active and not already talking
            if(NPC.ActiveNPC && !isInDialog)
            {
                InteractTriggerUI.SetActive(false);
                // Start dialog
                isInDialog = true;
                gameObject.transform.GetComponent<ThirdPersonMovement>().enabled = false;
                DialogUI.Instance.dialogueRunner.StartDialogue(NPC.ActiveNPC.YarnStartNode);
            }
        }
    }
}
