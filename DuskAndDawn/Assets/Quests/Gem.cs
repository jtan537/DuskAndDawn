using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class Gem : InventoryItemBase
{
    [SerializeField]
    GameObject _shadow;

    public bool pickedUp = false;
    public override void OnPickup(Collider collider)
    {
        collider.enabled = false;
        gameObject.GetComponent<MeshRenderer>().enabled = false;
        gameObject.GetComponent<BoxCollider>().enabled = false;
        pickedUp = true;
        if (_shadow)
        {
            _shadow.SetActive(false);
        }
    }

    public override string Name
    {
    	get
    	{
    		return "Gem";
    	}
    }
}
