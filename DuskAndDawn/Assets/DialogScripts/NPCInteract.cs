using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class NPCInteract : MonoBehaviour
{
	public bool isInDialog = false;

    public GameObject InteractTriggerUI;
    public ItemDropHandler[] handlers;
    public Metadata info;

// #pragma warning disable 0649
//     [SerializeField] SpeakerData speakerData;
// #pragma warning restore 0649

    // void Start()
    // {
    //     GameObject.FindObjectOfType<DialogUI>().AddSpeaker(speakerData);
    // }

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
        // Check if NPC is active and not already talking and active NPC is for current player
        if(NPC.ActiveNPC && !isInDialog && NPC.ActiveNPC.gameObject.tag == gameObject.name)
        {
            InteractTriggerUI.SetActive(false);
            // Start dialog
            isInDialog = true;
            gameObject.transform.GetComponent<ThreeDMovement>().enabled = false;
            GameObject.FindObjectOfType<DialogUI>().dialogueRunner.StartDialogue(NPC.ActiveNPC.YarnStartNode);
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
            gameObject.transform.GetComponent<ThreeDMovement>().enabled = false;
            GameObject.FindObjectOfType<DialogUI>().dialogueRunner.StartDialogue(yarnStartNode);
        }
    }
}
