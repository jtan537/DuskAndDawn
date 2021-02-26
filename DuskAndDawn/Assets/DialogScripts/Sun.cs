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

    public override void OnDelete(Transform trans)
    {
        quest.numRequiredSuns -= 1;
    }

    public override void OnPickup()
    {
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
