using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using TMPro;

public class MoonFlower : InventoryItemBase
{
    CatQuest quest;

    public GameObject InteractTriggerUI;
    public GameObject textObj;
    public string text;

    InventoryCollider invcollider;

    private void Start()
    {
        quest = GameObject.FindObjectOfType<CatQuest>();
        invcollider = GameObject.FindObjectOfType<InventoryCollider>();
    }

    public override void OnUse()
    {
        quest.numRequiredFlowers -= 1;
    }

    public override void OnPickup()
    {
        gameObject.SetActive(true);
    }

    public override string Name
    {
    	get
    	{
    		return "MoonFlower";
    	}
    }

    // private void OnTriggerEnter(Collider collision)
    // {
    //     if(collision.CompareTag("Player"))
    //     {
    //     	invcollider.active = true;
    //         textObj.GetComponent<TextMeshProUGUI>().SetText(text);
    //         InteractTriggerUI.SetActive(true);
    //     }
    // }

    // private void OnTriggerExit(Collider collision)
    // {
    //     if(collision.CompareTag("Player"))
    //     {
    //     	invcollider.active = false;
    //         textObj.GetComponent<TextMeshProUGUI>().SetText("");
    //         InteractTriggerUI.SetActive(false);
    //     }
    // }
}
