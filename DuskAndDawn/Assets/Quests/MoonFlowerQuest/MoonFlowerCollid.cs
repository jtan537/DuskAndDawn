using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using TMPro;
using Yarn.Unity;
using System;

public class MoonFlowerCollid : MonoBehaviour
{
	public NPC cat;
	bool canTakePhoto = false;
    bool takenPhoto = false;

	public string yarnStartNode = "Start";
    public YarnProgram yarnDialog;

    public GameObject InteractTriggerUI;
    public GameObject textObj;
    public string text;

    public Inventory inventory;

    private Metadata _metadata;

    void Start()
    {
    	try
        {
            GameObject.FindObjectOfType<DialogUI>().dialogueRunner.Add(yarnDialog);
        } catch (Exception e)
        {
            print("Readding Yarn dialog: " + yarnDialog.name);
        }
    }

    void Update()
    {
    	if (!takenPhoto && canTakePhoto && Input.GetKeyDown(KeyCode.F))
    	{
           // textObj.GetComponent<TextMeshProUGUI>().SetText("");
            InteractTriggerUI.SetActive(false);
    		IInventoryItem item = gameObject.GetComponent<IInventoryItem>();
    		inventory.AddItem(item);
            takenPhoto = true;

        }
    }

    private void OnTriggerEnter(Collider collision)
    {
        if (collision.CompareTag("Player"))
        {
             if (cat.activatedQuest)
             {
                 //          GetComponent<AudioSource>().Play();
              //   textObj.GetComponent<TextMeshProUGUI>().SetText(text);
                 InteractTriggerUI.SetActive(true);
                 canTakePhoto = true;
             }
         //   DialogUI.Instance.dialogueRunner.StartDialogue(yarnStartNode);
        }
    }

    private void OnTriggerExit(Collider collision)
    {
        if (collision.CompareTag("Player"))
        {
          //  textObj.GetComponent<TextMeshProUGUI>().SetText("");
            InteractTriggerUI.SetActive(false);
        }
    }

    public void OnNodeComplete(String nodeName)
    {
        if (nodeName == "Flower.Visited")
        {
          //  textObj.GetComponent<TextMeshProUGUI>().SetText(text);
            InteractTriggerUI.SetActive(true);
            canTakePhoto = true;
        }
    }
}
