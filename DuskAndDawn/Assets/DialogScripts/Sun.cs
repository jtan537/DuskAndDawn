using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class Sun : InventoryItemBase
{
    
    TreeQuest quest;

    private void Start()
    {
        quest = GameObject.FindObjectOfType<TreeQuest>();
    }

    public override void OnUse()
    {
        quest.numRequiredSuns -= 1;
    }

    public override void OnPickup(Collider collider)
    {
        collider.enabled = false;
        gameObject.SetActive(false);
    }

    public override string Name
    {
    	get
    	{
    		return "Sun";
    	}
    }
}
