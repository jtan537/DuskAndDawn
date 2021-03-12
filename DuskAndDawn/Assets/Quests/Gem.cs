using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class Gem : InventoryItemBase
{

    public override void OnPickup(Collider collider)
    {
        collider.enabled = false;
        gameObject.SetActive(false);
    }

    public override string Name
    {
    	get
    	{
    		return "Gem";
    	}
    }
}
