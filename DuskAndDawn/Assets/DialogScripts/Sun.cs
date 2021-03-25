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
        GetComponent<AudioSource>().Play();
        collider.enabled = false;
        gameObject.GetComponent<MeshRenderer>().enabled = false;
        gameObject.GetComponent<BoxCollider>().enabled = false;
    }

    public override string Name
    {
    	get
    	{
    		return "Sun";
    	}
    }
    public override string Description
    {
        get
        {
            return "A raw core of the sun. It is said when you collect three of them, it can help revive the dead.";
        }
    }
}
