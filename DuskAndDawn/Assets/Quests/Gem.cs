using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class Gem : InventoryItemBase
{
    [SerializeField]
    GameObject _shadow;

    AudioSource audioClip;

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
        GetComponent<AudioSource>().Play();
    }

    public override string Name
    {
    	get
    	{
    		return "Gem";
    	}
    }
    public override string Description
    {
        get
        {
            return "A gem that is extremely valuable. Rumours have it that collecting four of them will unlock something special.";
        }
    }
}
