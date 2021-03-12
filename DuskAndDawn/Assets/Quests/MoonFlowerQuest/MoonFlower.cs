using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using TMPro;

public class MoonFlower : InventoryItemBase
{
    CatQuest quest;

    private void Start()
    {
        quest = GameObject.FindObjectOfType<CatQuest>();
        // invcollider = GameObject.FindObjectOfType<InventoryCollider>();
    }

    public override void OnUse()
    {
        quest.numRequiredFlowers -= 1;
    }

    public override void OnPickup(Collider collider)
    {
    }

    public override string Name
    {
    	get
    	{
    		return "MoonFlower";
    	}
    }
}
